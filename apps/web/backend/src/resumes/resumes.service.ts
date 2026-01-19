import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
    private readonly nlpClientService: NlpClientService
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
      throw new NotFoundException(`Candidato con email ${dto.email} no encontrado`);
    }

    return updatedCandidate;
  }

  async updateResume(candidateId: number, file: Express.Multer.File) {
    // 1. Preparar el destino
    const uploadDir = resolve(process.cwd(), 'uploads', 'resumes');
    // 2. Generar nombre único para evitar colisiones
    const fileName = `${uuidv4()}${extname(file.originalname)}`;
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, fileName);

    try {
      // 3. Persistencia física: Guardamos el buffer en el disco
      await writeFile(filePath, file.buffer);

      // 4. Persistencia lógica: Actualizamos la URL en la DB
      // Usamos la ruta relativa para que sea accesible luego vía web
      const relativePath = `/uploads/resumes/${fileName}`;
      
      const [updatedCandidate] = await this.db
        .update(schema.candidates)
        .set({ defaultResumeUrl: relativePath })
        .where(eq(schema.candidates.id, candidateId))
        .returning();

      if (!updatedCandidate) {
        // Si no existe el candidato, borramos el archivo que acabamos de guardar
        throw new NotFoundException('Candidato no encontrado');
      }
      // Notificar al servicio NLP
      this.nlpClientService.notifyNlpService(candidateId, filePath);

      return {
        message: 'Currículum actualizado con éxito',
        resumeUrl: updatedCandidate.defaultResumeUrl,
      };

    } catch (error) {
      // 5. Rollback manual del archivo
      // Si la DB falla o el candidato no existe, el archivo no debe quedar en el disco
      if (await this.fileExists(filePath)) {
        await unlink(filePath).catch(() => null);
      }
      
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al procesar el archivo');
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await import('fs/promises').then(fs => fs.access(path));
      return true;
    } catch {
      return false;
    }
  }
}

