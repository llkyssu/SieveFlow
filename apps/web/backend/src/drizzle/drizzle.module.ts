import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Definimos una constante para el nombre del token de inyección
export const DRIZZLE = 'DRIZZLE';

@Global() // Lo hacemos global para no importarlo en cada módulo
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => {
        // 1. Construcción de la URL
        // definida por postgres://user:password@host:port/database
        const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@localhost:${process.env.DB_PORT}/${process.env.DB_NAME}`;

        // 2. Crear el Cliente de bajo nivel
        const queryClient = postgres(connectionString);

        // 3. Inicializar Drizzle
        return drizzle(queryClient, { schema });
      },
    },
  ],
  exports: [DRIZZLE], // Exportamos el token para que otros servicios lo inyecten
})
export class DrizzleModule {}
