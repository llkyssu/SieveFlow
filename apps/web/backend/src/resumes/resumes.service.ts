import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NewCandidateDto } from 'src/dto/new-candidate.dto';
import { NlpClientService } from './nlp-client.service';

@Injectable()
export class ResumesService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly nlpClientService: NlpClientService,
  ) {}

  // Lógica: Solo crea si no existe. Si existe, lo retorna.
  async findOrCreateCandidate(dto: NewCandidateDto) {
    const existing = await this.db.query.candidates.findFirst({
      where: eq(schema.candidates.email, dto.email),
    });

    if (existing) return existing;

    const [newCandidate] = await this.db
      .insert(schema.candidates)
      .values(dto)
      .returning();

    return newCandidate;
  }

  // Lógica: Busca por email y sobreescribe los datos.
  async updateCandidate(dto: NewCandidateDto) {
    const [updatedCandidate] = await this.db
      .update(schema.candidates)
      .set({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl,
        // No actualizamos el email porque es nuestra llave de búsqueda
      })
      .where(eq(schema.candidates.email, dto.email))
      .returning();

    if (!updatedCandidate) {
      throw new NotFoundException(
        `Candidato con email ${dto.email} no encontrado`,
      );
    }

    return updatedCandidate;
  }

  async updateResume(candidateId: number, file: Express.Multer.File) {
  // 1. Buscamos la aplicación activa de este candidato con sus requisitos
  // Nota: Asumimos que el candidato tiene una aplicación pendiente. 
  const application = await this.db.query.applications.findFirst({
    where: eq(schema.applications.candidateId, candidateId),
    with: {
      job: true, // Esto requiere que tengas definida la relación en tu schema.ts
    },
    orderBy: (apps, { desc }) => [desc(apps.createdAt)], // Traemos la más reciente
  });

  if (!application || !application.job) {
    throw new NotFoundException('No se encontró una aplicación o puesto asociado para este candidato.');
  }

  const uploadDir = resolve(process.cwd(), 'uploads', 'resumes');
  const fileName = `${uuidv4()}${extname(file.originalname)}`;
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, fileName);

  try {
    // 2. Guardar archivo físico
    await writeFile(filePath, file.buffer);
    const relativePath = `/uploads/resumes/${fileName}`;

    // 3. Actualizar la URL en la tabla de candidatos
    await this.db
      .update(schema.candidates)
      .set({ defaultResumeUrl: relativePath })
      .where(eq(schema.candidates.id, candidateId));

    // 4. NOTIFICAR A PYTHON (Versión Final)
    // Convertimos el objeto de requisitos a un string legible para el prompt de Gemini
    const requirementsString = JSON.stringify(application.job.requirements);
    
    this.nlpClientService.notifyNlpService(
      application.id, 
      filePath, 
      requirementsString
    );

    return {
      message: 'Currículum actualizado y enviado a análisis de IA',
      applicationId: application.id
    };
  } catch (error) {
    if (await this.fileExists(filePath)) await unlink(filePath).catch(() => null);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    throw new InternalServerErrorException(`Error crítico: ${errorMessage}`);
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await import('fs/promises').then((fs) => fs.access(path));
      return true;
    } catch {
      return false;
    }
  }
}
