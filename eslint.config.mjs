import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // ~110 existing `any`s, mostly around Prisma JSON columns and form config.
      // Kept visible as warnings to pay down over time; new code should avoid them.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Plain Node scripts are CommonJS.
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts']),
]);
