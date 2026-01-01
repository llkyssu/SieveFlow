# @sieveflow/config

Configuraciones compartidas para el monorepo SieveFlow.

## Uso

### TypeScript

En tu `tsconfig.json`:

```json
{
  "extends": "@sieveflow/config/typescript/nestjs.json"
}
```

Configuraciones disponibles:
- `base.json` - Base común
- `nestjs.json` - Para proyectos NestJS
- `nextjs.json` - Para proyectos Next.js

### Prettier

En tu `package.json` o `.prettierrc.js`:

```js
module.exports = require('@sieveflow/config/prettier');
```

### ESLint

En tu `eslint.config.js`:

```js
module.exports = require('@sieveflow/config/eslint/base');
```
