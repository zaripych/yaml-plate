import {
  build,
  ROOT,
  emptyDirSafe,
  spawnAndCheck,
  sortedDirectoryContents,
} from './helpers';
import { join } from 'path';
import { ensureDir, readFile } from 'fs-extra';
import yaml from 'js-yaml';

describe('yaml-plate', () => {
  const outCombinedDir = join(ROOT, 'integration-test-combine-yaml');
  const outDir = join(ROOT, 'integration-test-dir-yaml');
  const directory = join(__dirname, 'test-yaml-files');
  const context = join(__dirname, 'yaml.plate.config.js');
  const outFile = join(outCombinedDir, 'combined.yaml');

  beforeAll(async () => {
    await emptyDirSafe(outCombinedDir);
    await ensureDir(outCombinedDir);
    await emptyDirSafe(outDir);
    await ensureDir(outDir);

    await build();
  });

  describe('when combining input into a single file', () => {
    beforeAll(() => {
      spawnAndCheck(
        'node',
        [
          './lib/yaml-plate.js',
          '-c',
          context,
          '-p',
          `${directory}/**/*.yaml`,
          '-s',
          outFile,
          '--sorted',
        ],
        {
          cwd: ROOT,
        }
      );
    });

    it('should output the file', async () => {
      expect(await sortedDirectoryContents(outCombinedDir))
        .toMatchInlineSnapshot(`
          Array [
            "combined.yaml",
          ]
        `);

      expect(await readFile(outFile, 'utf8')).toMatchSnapshot();
    });

    describe('when output to directory', () => {
      beforeAll(() => {
        spawnAndCheck(
          'node',
          [
            './lib/yaml-plate.js',
            '-c',
            context,
            '-p',
            `${directory}/**/*.yaml`,
            '-d',
            outDir,
            '-b',
            'src/__integration-tests__/test-yaml-files',
            '--sorted',
          ],
          {
            cwd: ROOT,
          }
        );
      });

      it('should generate directory', async () => {
        expect(await sortedDirectoryContents(outDir)).toMatchInlineSnapshot(`
          Array [
            "double-empty.yaml",
            "empty-doc.yaml",
            "multiple-docs-with-empty.yaml",
            "multiple-docs.yaml",
            "single-doc.yaml",
          ]
        `);
      });

      it('contents of the directory and combined file should be same', async () => {
        const files = await sortedDirectoryContents(outDir);
        const contentsFromDir = await Promise.all(
          files.map(file => readFile(join(outDir, file), 'utf8'))
        );
        const contentFromCombined = await readFile(outFile, 'utf8');

        const dirLoaded = contentsFromDir.reduce((acc, item) => {
          const data = yaml.safeLoadAll(item);
          return [...acc, ...(data.length === 0 ? [null] : data)];
        }, []);
        const combinedLoaded = yaml.safeLoadAll(contentFromCombined);

        expect(combinedLoaded).toEqual(dirLoaded);
      });
    });
  });
});
