import { internals } from '@src/eval';

const { evaluate } = internals;
type Params = Parameters<typeof evaluate>;

describe('given simple text script', () => {
  const params: Params[0] = {
    chunk: 'hello ${"world"}',
    context: {},
    path: 'input.txt',
    script: '"world"',
    type: 'text',
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: 'world',
    });
  });
});

describe('when script evaluates to a function', () => {
  const params: Params[0] = {
    chunk: 'hello ${console.log}',
    context: {},
    path: 'input.txt',
    script: 'console.log',
    type: 'text',
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'remove',
    });
  });
});

describe('when script evaluates to a function', () => {
  const params: Params[0] = {
    chunk: 'hello ${}',
    context: {},
    path: 'input.txt',
    script: 'console.log',
    type: 'text',
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'remove',
    });
  });
});
