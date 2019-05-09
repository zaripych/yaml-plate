import { resolveContext } from '@src/resolveContext';
import { join } from 'path';

describe('given non-existing file', () => {
  const path = 'some-file.js';

  it('should throw', async () => {
    await expect(resolveContext(path)).rejects.toThrow();
  });
});

describe('given valid file which throws unfortunately', () => {
  const path = join(__dirname, './resolveContext.throws');

  it('should throw', async () => {
    await expect(resolveContext(path)).rejects.toThrow(`I'm a bad module`);
  });
});

describe('given valid file with exported async function that rejects', () => {
  const path = join(__dirname, './resolveContext.rejectingAsyncFunction');

  it('should empty', async () => {
    await expect(resolveContext(path)).rejects.toThrow(`I'm a bad module`);
  });
});

describe('given valid file with no exports', () => {
  const path = join(__dirname, './resolveContext.noExports');

  it('should empty', async () => {
    await expect(resolveContext(path)).resolves.toEqual({});
  });
});

describe('given valid file with empty default export', () => {
  const path = join(__dirname, './resolveContext.empty');

  it('should empty', async () => {
    await expect(resolveContext(path)).resolves.toEqual({});
  });
});

describe('given valid file with exported object', () => {
  const path = join(__dirname, './resolveContext.object');

  it('should work', async () => {
    await expect(resolveContext(path)).resolves.toEqual({
      usefulConstant: '1',
    });
  });
});

describe('given valid file with exported object', () => {
  const path = join(__dirname, './resolveContext.nonEsModule');

  it('should work', async () => {
    await expect(resolveContext(path)).resolves.toEqual({
      usefulConstant: '1',
    });
  });
});

describe('given valid file with exported null', () => {
  const path = join(__dirname, './resolveContext.null');

  it('should empty', async () => {
    await expect(resolveContext(path)).resolves.toEqual({});
  });
});

describe('given valid file with exported function', () => {
  const path = join(__dirname, './resolveContext.function');

  it('should empty', async () => {
    await expect(resolveContext(path)).resolves.toEqual({
      usefulConstant: '1',
    });
  });
});

describe('given valid file with exported async function', () => {
  const path = join(__dirname, './resolveContext.asyncFunction');

  it('should empty', async () => {
    await expect(resolveContext(path)).resolves.toEqual({
      usefulConstant: '1',
    });
  });
});

describe('given valid file with exported object', () => {
  const path = join(__dirname, './resolveContext.object');

  it('should work', async () => {
    await expect(resolveContext(path)).resolves.toEqual({
      usefulConstant: '1',
    });
  });
});

describe('given object', () => {
  const param = {};

  it('should work', async () => {
    await expect(resolveContext(param)).resolves.toEqual({});
  });
});

describe('given function', () => {
  const param = () => ({});

  it('should work', async () => {
    await expect(resolveContext(param)).resolves.toEqual({});
  });
});

describe('given async function', () => {
  const param = () => Promise.resolve({});

  it('should work', async () => {
    await expect(resolveContext(param)).resolves.toEqual({});
  });
});
