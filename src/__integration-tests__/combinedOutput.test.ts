import { spawnSync } from 'child_process';
import { pathExists } from 'fs-extra';
import { determineRootDir, spawn } from './helpers';

describe('given invalid json', () => {
  beforeAll(async () => {
    const cwd = await determineRootDir();

    await spawn('yarn', ['run', 'build'], {
      cwd,
      shell: process.platform === 'win32',
    });
  });

  it('should work', () => {
    return;
  });
});
