import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'drizzle-kit';

// Usamos path.resolve para asegurarnos de que encuentre el .env en la raíz
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export default defineConfig({
  schema: './src/drizzle/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    ssl: false,
  },
});
