import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { NewCandidateDto } from '../dto/new-candidate.dto';
import { ResumesService } from '../resumes/resumes.service'; // Asegúrate que la ruta sea correcta

@Injectable()
export class CandidatesService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
    private readonly resumesService: ResumesService, 
  ) {}

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

  async updateCandidate(dto: NewCandidateDto) {
    const [updatedCandidate] = await this.db
      .update(schema.candidates)
      .set({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl,
      })
      .where(eq(schema.candidates.email, dto.email))
      .returning();

    if (!updatedCandidate) {
      throw new NotFoundException(`Candidato con email ${dto.email} no encontrado`);
    }

    return updatedCandidate;
  }

  // Subir CV "Default" al perfil del candidato
  async uploadDefaultResume(candidateId: number, file: Express.Multer.File) {
    // 1. Verificar existencia
    const candidate = await this.db.query.candidates.findFirst({
      where: eq(schema.candidates.id, candidateId),
    });
    
    if (!candidate) throw new NotFoundException('Candidato no encontrado');

    // 2. Delegar el almacenamiento al servicio experto
    const storageResult = await this.resumesService.saveFile(file, 'resumes');
    
    // 3. Actualizar la DB con la ruta pública
    const [updated] = await this.db
      .update(schema.candidates)
      .set({ defaultResumeUrl: storageResult.publicUrl })
      .where(eq(schema.candidates.id, candidateId))
      .returning();

    return updated;
  }
}