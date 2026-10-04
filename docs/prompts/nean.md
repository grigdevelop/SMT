Set up this Neon project in the current working directory.

1. `npm i -g neon@latest && neon login`
2. `neon skills -y`
3. `neon mcp -y`
4. `neon link --project-id tiny-wildflower-78444852 --branch production -y`
5. `neon config init`
6. Update `neon.ts`:

```ts
import { defineConfig } from '@neon/config/v1';

export default defineConfig({});
```

7. `neon deploy`
