import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = resolve(
  root,
  process.env.OPENAPI_SPEC ?? '../../../roomwise-api/apps/api/openapi.json',
);
const output = resolve(root, 'src/generated/api.d.ts');

const ast = await openapiTS(pathToFileURL(spec));
await mkdir(dirname(output), { recursive: true });
await writeFile(output, astToString(ast), 'utf8');
