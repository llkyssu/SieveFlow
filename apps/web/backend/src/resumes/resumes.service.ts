// apps/web/backend/src/resumes/resumes.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  /**
   * Guarda un buffer en disco y retorna las rutas para DB y servicios externos.
   */
  async saveFile(file: Express.Multer.File, subFolder: 'resumes' | 'covers' = 'resumes') {
    try {
      // 1. Definir la ruta base: apps/web/backend/uploads/...
      const uploadDir = resolve(process.cwd(), 'uploads', subFolder);
      
      // 2. Asegurar que la carpeta exista
      await mkdir(uploadDir, { recursive: true });

      // 3. Generar nombre único y ruta absoluta
      const fileName = `${uuidv4()}${extname(file.originalname)}`;
      const absolutePath = join(uploadDir, fileName);

      // 4. Persistencia física
      await writeFile(absolutePath, file.buffer);

      this.logger.log(`Archivo guardado físicamente en: ${absolutePath}`);

      return {
        fileName,
        absolutePath, // Para que Python (NLP) lo lea directamente
        publicUrl: `/uploads/${subFolder}/${fileName}`, // Para guardar en la DB (URL relativa)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al guardar archivo: ${errorMessage}`);
      throw new InternalServerErrorException('No se pudo guardar el archivo en el servidor.');
    }
  }

  /**
   * Elimina un archivo del disco de forma segura.
   */
  async removeFile(absolutePath: string): Promise<void> {
    try {
      if (await this.exists(absolutePath)) {
        await unlink(absolutePath);
        this.logger.log(`Archivo eliminado: ${absolutePath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo eliminar el archivo en ${absolutePath}: ${errorMessage}`);
    }
  }

  /**
   * Utilidad privada para verificar si un archivo existe.
   */
  private async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}