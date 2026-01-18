import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../drizzle/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  // Inyectamos la base de datos en el constructor
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  // --------------------------------------------------------------------------

  async signUp(name: string, email: string, password: string): Promise<string> {
    const [existingUser] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));

    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await this.db
      .insert(schema.users)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({ id: schema.users.id });

    return result.id.toString();
  }

  async login(email: string, password: string): Promise<string> {
    const [user] = await this.db // Usamos desestructuración [user] para no usar user[0]
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    // Si no hay usuario, lanzamos 401 Unauthorized
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    // Si la clave falla, lanzamos 401 Unauthorized
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user.id.toString();
  }
}
