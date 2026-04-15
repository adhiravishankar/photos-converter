import * as path from 'path';
import * as fse from 'fs-extra';
import { v4, v7 } from 'uuid';

export type FileNameStrategy = 'numeric' | 'uuid-v4' | 'uuid-v7' | 'keep-file-name';

export const DEFAULT_FILE_NAME_STRATEGY: FileNameStrategy = 'keep-file-name';

export interface FileNameGeneratorOptions {
  outputDir: string;
  extension: string;
  strategy?: FileNameStrategy;
}

type ExistingNamesByExtension = Set<string>;

function normalizeExtension(extension: string): string {
  return extension.startsWith('.') ? extension : `.${extension}`;
}

async function getNextNumericStart(outputDir: string, extension: string): Promise<number> {
  const ext = normalizeExtension(extension).toLowerCase();
  const exists = await fse.pathExists(outputDir);
  if (!exists) {
    return 1;
  }

  const files = await fse.readdir(outputDir);
  let maxNumericName = 0;

  for (const file of files) {
    if (path.extname(file).toLowerCase() !== ext) {
      continue;
    }

    const baseName = path.basename(file, ext);
    if (!/^\d+$/.test(baseName)) {
      continue;
    }

    const parsed = Number.parseInt(baseName, 10);
    if (Number.isFinite(parsed) && parsed > maxNumericName) {
      maxNumericName = parsed;
    }
  }

  return maxNumericName + 1;
}

async function getExistingBaseNames(outputDir: string, extension: string): Promise<ExistingNamesByExtension> {
  const ext = normalizeExtension(extension).toLowerCase();
  const names: ExistingNamesByExtension = new Set();
  const exists = await fse.pathExists(outputDir);
  if (!exists) {
    return names;
  }

  const files = await fse.readdir(outputDir);
  for (const file of files) {
    if (path.extname(file).toLowerCase() !== ext) {
      continue;
    }

    names.add(path.basename(file, ext));
  }

  return names;
}

export async function createFileNameGenerator(
  options: FileNameGeneratorOptions,
): Promise<(sourceFileName: string) => string> {
  const strategy = options.strategy ?? DEFAULT_FILE_NAME_STRATEGY;

  if (strategy === 'uuid-v4') {
    return () => v4();
  }

  if (strategy === 'uuid-v7') {
    return () => v7();
  }

  if (strategy === 'keep-file-name') {
    const ext = normalizeExtension(options.extension);
    const usedBaseNames = await getExistingBaseNames(options.outputDir, ext);

    return (sourceFileName: string) => {
      const sourceBaseName = path.basename(sourceFileName, path.extname(sourceFileName));
      let candidate = sourceBaseName;
      let suffix = 1;

      while (usedBaseNames.has(candidate)) {
        candidate = `${sourceBaseName}-${suffix}`;
        suffix += 1;
      }

      usedBaseNames.add(candidate);
      return candidate;
    };
  }

  let next = await getNextNumericStart(options.outputDir, options.extension);
  return () => {
    const value = next;
    next += 1;
    return String(value);
  };
}
