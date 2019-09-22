import { join, relative, isAbsolute, resolve } from 'path';

export function outputPath(outDir: string, file: string, baseDir?: string) {
  if (!isAbsolute(file)) {
    throw new Error(
      'Only absolute file path should be used with this function'
    );
  }
  if (baseDir) {
    const resolved = resolve(baseDir);
    if (!file.startsWith(resolved)) {
      throw new Error(
        `Source file at '${file}' is outside base directory '${baseDir}'`
      );
    }
  }
  const destinationPath = join(
    outDir,
    relative(baseDir || './', file).replace(/^(\.\.\/)+/g, '')
  );
  return destinationPath;
}
