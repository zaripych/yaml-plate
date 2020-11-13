import { outputPath } from '@src/outputPath';
import { join, resolve } from 'path';

describe('outputPath', () => {
  describe('given file outside current dir', () => {
    const outDir = './out/dir';
    const file = resolve(join(__dirname, '../../../x/something.yaml'));

    it('should work', () => {
      expect(outputPath(outDir, file)).toBe('out/dir/x/something.yaml');
    });
  });

  describe('given file within current dir', () => {
    const outDir = './out/dir';
    const file = resolve(join(__dirname, './yaml-files/x/something.yaml'));

    it('should work', () => {
      expect(outputPath(outDir, file)).toBe(
        'out/dir/src/__tests__/yaml-files/x/something.yaml'
      );
    });
  });

  describe('given file within current dir with base dir', () => {
    const outDir = './out/dir';
    const file = resolve(join(__dirname, './yaml-files/x/something.yaml'));
    const baseDir = 'src/__tests__/yaml-files/x';

    it('should work', () => {
      expect(outputPath(outDir, file, baseDir)).toBe('out/dir/something.yaml');
    });
  });

  describe('given file outside current dir with base dir', () => {
    const outDir = './out/dir';
    const file = resolve(
      join(__dirname, '../../../../yaml-files/x/something.yaml')
    );
    const baseDir = '../../yaml-files/x';

    it('should work', () => {
      expect(outputPath(outDir, file, baseDir)).toBe('out/dir/something.yaml');
    });
  });
});
