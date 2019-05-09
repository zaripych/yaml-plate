import { pathExists } from 'fs-extra';
import { spawnSync, SpawnSyncReturns } from 'child_process';

export async function determineRootDir() {
  const pkgExists = await pathExists('./package.json');

  if (!pkgExists) {
    throw new Error('Cannot find package.json in current directory');
  }

  return process.cwd();
}

export const spawn = (
  ...params: Parameters<typeof spawnSync>
): Promise<SpawnSyncReturns<string>> => {
  const opts = Array.isArray(params[1]) ? params[2] : params[1];

  const result = spawnSync(
    params[0],
    Array.isArray(params[1]) ? params[1] : [],
    {
      ...opts,
      encoding: 'utf8',
    }
  ) as SpawnSyncReturns<string>;

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${params[0]} app returned ${result.status} code`);
  }

  return Promise.resolve(result);
};
