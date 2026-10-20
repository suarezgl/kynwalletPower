import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');

function listTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listTsFiles(full) : full.endsWith('.ts') ? [full] : [];
  });
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

describe('arquitectura en capas (Constitución III)', () => {
  const forbidden: Record<string, string[]> = {
    domain: ['application', 'infrastructure', 'interfaces'],
    application: ['infrastructure', 'interfaces'],
  };

  for (const [layer, banned] of Object.entries(forbidden)) {
    it(`la capa ${layer} no importa ${banned.join(', ')}`, () => {
      const offenders = listTsFiles(join(SRC, layer)).flatMap((file) =>
        importsOf(file)
          .filter((specifier) => specifier.startsWith('.'))
          .filter((specifier) => banned.some((name) => specifier.split('/').includes(name)))
          .map((specifier) => `${relative(SRC, file)} -> ${specifier}`),
      );
      expect(offenders).toEqual([]);
    });
  }
});
