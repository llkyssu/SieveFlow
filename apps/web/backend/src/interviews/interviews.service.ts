import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>
  ) {}

  async scheduleInterview(dto: ScheduleInterviewDto) {
    // 1. Verificación de existencia y estado de la aplicación
    const application = await this.db.query.applications.findFirst({
      where: eq(schema.applications.id, dto.applicationId),
    });

    if (!application) {
      throw new NotFoundException('Postulación no encontrada');
    }

    // 2. Verificación de lógica de negocio (Filtro de cascada)
    if (application.decision === 'REJECT') {
      throw new BadRequestException('No se puede programar entrevista a un candidato rechazado');
    }

    if (application.decision === 'HOLD') {
      throw new BadRequestException('No se puede programar entrevista a un candidato en espera');
    }

    const activeInterview = await this.db.query.interviews.findFirst({  
      where: and(
        eq(schema.interviews.applicationId, dto.applicationId),
        eq(schema.interviews.status, 'scheduled') // <--- Solo nos importa si ya tiene agenda activa
      ),
    });

    if (activeInterview) {
      throw new BadRequestException('Ya existe una entrevista activa programada para este candidato');
    }

    return await this.db.transaction(async (tx) => {
      // 3. Crear la entrevista
      const [newInterview] = await tx
        .insert(schema.interviews)
        .values({
          applicationId: dto.applicationId,
          scheduledAt: new Date(dto.scheduledAt),
          meetingLink: dto.meetingLink,
          status: 'scheduled',
        })
        .returning();

      // 4. Actualizar el estado de la aplicación automáticamente (El "tobogán")
      await tx
        .update(schema.applications)
        .set({ status: 'interview' })
        .where(eq(schema.applications.id, dto.applicationId));

      return newInterview;
    });
  }
  async updateInterview(id: number, updates: Partial<ScheduleInterviewDto>) {
    const [updatedInterview] = await this.db
      .update(schema.interviews)
      .set({
        scheduledAt: updates.scheduledAt ? new Date(updates.scheduledAt) : undefined,
        meetingLink: updates.meetingLink,
      })
      .where(eq(schema.interviews.id, id))
      .returning();

    if (!updatedInterview) {
      throw new NotFoundException('Entrevista no encontrada');
    }

    return updatedInterview;
  }
  
  async getInterviewById(id: number) {
    const interview = await this.db.query.interviews.findFirst({
      where: eq(schema.interviews.id, id),
    }); 
    if (!interview) {
      throw new NotFoundException('Entrevista no encontrada');
    } 
    return interview;
  }

  async getInterviewsByAppId(applicationId: number) {
    const interviews = await this.db.query.interviews.findMany({
      where: eq(schema.interviews.applicationId, applicationId),
    });
    return interviews;
  } 

  async cancelInterview(interviewId: number) {
    return await this.db.transaction(async (tx) => {
      // 1. Obtener la entrevista y verificar estado
      const interview = await tx.query.interviews.findFirst({
        where: eq(schema.interviews.id, interviewId),
      });

      if (!interview) {
        throw new NotFoundException('Entrevista no encontrada');
      }

      if (interview.status === 'canceled') {
        throw new BadRequestException('La entrevista ya está cancelada');
      }

      // 2. Marcar entrevista como cancelada (Histórico)
      const [updatedInterview] = await tx
        .update(schema.interviews)
        .set({ status: 'canceled' })
        .where(eq(schema.interviews.id, interviewId))
        .returning();

      // 3. RETROCESO CONTROLADO: Devolver la aplicación a 'reviewed'
      // Esto "libera" al candidato para ser agendado nuevamente
      await tx
        .update(schema.applications)
        .set({ status: 'reviewed' }) 
        .where(eq(schema.applications.id, interview.applicationId));

      return updatedInterview;
    });
  }
}