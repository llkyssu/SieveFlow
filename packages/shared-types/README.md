# @sieveflow/shared-types

Tipos TypeScript compartidos para el monorepo SieveFlow.

## Uso

```typescript
import { ApiResponse, User, UserRole } from '@sieveflow/shared-types';

// En tu backend o frontend
const response: ApiResponse<User> = {
  success: true,
  data: {
    id: '1',
    email: 'user@example.com',
    name: 'John Doe',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};
```

## Estructura

- `api.ts` - Tipos de API (requests, responses, paginación)
- `database.ts` - Tipos de entidades de base de datos
- `common.ts` - Tipos utilitarios comunes
