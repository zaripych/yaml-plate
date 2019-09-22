import { spawnSync } from 'child_process';
import { readFile, remove, emptyDir, pathExists, unlink } from 'fs-extra';
import { resolve, join, normalize, relative } from 'path';
import fg from 'fast-glob';

export const PKG_JSON = 'package.json';
export const ROOT = resolve(__dirname, '../../');

// - start of the archive file name after yarn pack
const ARCH_PKG_FILE_NAME = 'yaml-plate';

export const packageJsonVersion = async () => {
  console.log('Retrieving package json');

  const packageJsonLocation = join(ROOT, PKG_JSON);

  const packageJsonContents = await readFile(packageJsonLocation, {
    encoding: 'utf-8',
  });

  const pkg = JSON.parse(packageJsonContents) as {
    version: string;
  };

  return pkg.version;
};

export const spawnAndCheck = (
  ...args: Parameters<typeof spawnSync>
): ReturnType<typeof spawnSync> => {
  const [app, cmdOrOpts, optsOrCb] = args;

  const cmd = Array.isArray(cmdOrOpts) ? cmdOrOpts : [];
  const opts = Array.isArray(cmdOrOpts) ? optsOrCb : cmdOrOpts;

  const effectiveOpts = {
    ...opts,
    shell: process.platform === 'win32',
    encoding: 'utf-8',
  };

  console.log(app, Array.isArray(cmd) ? cmd.join(' ') : '');

  const result = spawnSync(app, cmd, effectiveOpts);

  console.log(result.output.filter(Boolean).join(''));

  if (result.error as (Error | undefined)) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `process ${args[0]} exit with non-zero status code: ${result.status}`
    );
  }

  return result;
};

const checkSafety = async (dir: string) => {
  const normalized = normalize(dir);
  const relativePath = relative(ROOT, normalized);

  if (/\.\./g.test(relativePath)) {
    throw new Error(
      'We can only delete directories within the root of our package'
    );
  }

  const exists = await pathExists(normalized);
  return { exists, path: normalized };
};

export const emptyDirSafe = async (relativeToRoot: string) => {
  const { exists, path } = await checkSafety(relativeToRoot);
  if (!exists) {
    return;
  }

  await emptyDir(path);
};

export const rmDirSafe = async (relativeToRoot: string) => {
  const { exists, path } = await checkSafety(relativeToRoot);
  if (!exists) {
    return;
  }

  await remove(path);
};

export const build = async () => {
  spawnAndCheck('yarn', ['build'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  const libLocation = join(ROOT, 'lib');

  return { libLocation };
};

export const buildAndPack = async () => {
  const version = await packageJsonVersion();

  console.log('version', version);

  spawnAndCheck('yarn', ['build'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  const packageName = `${ARCH_PKG_FILE_NAME}-v${version}.tgz`;
  const packageLocation = join(ROOT, packageName);

  await unlink(packageLocation).catch(() => Promise.resolve());

  spawnAndCheck('yarn', ['pack'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
  });

  return { packageName, packageLocation, version };
};

const compareStrings = (a: string, b: string) => (a === b ? 0 : a > b ? 1 : -1);

const comparePathComponents = (a: string[], b: string[]): 0 | 1 | -1 => {
  if (a.length === 0 && b.length === 0) {
    return 0;
  }
  const i = compareStrings(a[0], b[0]);
  if (i === 0) {
    return comparePathComponents(a.slice(1), b.slice(1));
  } else {
    return i;
  }
};

const seps = /\\|\//g;

const comparePaths = (a: string, b: string) => {
  const componentsA = a.split(seps);
  const componentsB = b.split(seps);
  const result = comparePathComponents(componentsA, componentsB);
  return result;
};

const sortPaths = (files: string[]) => {
  files.sort(comparePaths);
};

export const sortedDirectoryContents = async (
  directory: string,
  patterns: string[] = ['**', '!node_modules/**', '!.git/**']
) => {
  const results = await fg(patterns, {
    cwd: directory,
    unique: true,
    markDirectories: true,
    onlyDirectories: false,
    onlyFiles: false,
    dot: true,
  });

  sortPaths(results);

  return results;
};
