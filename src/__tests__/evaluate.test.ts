import { internals } from '@src/eval';

const { evaluate } = internals;
type Params = Parameters<typeof evaluate>;

describe('given invalid script', () => {
  const params: Params[0] = {
    chunk: 'hello ${whoot?}',
    context: {},
    path: 'input.txt',
    script: 'whoot?',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should throw', () => {
    expect(() => evaluate(params)).toThrow();
  });
});

describe('given script returning text value', () => {
  const params: Params[0] = {
    chunk: 'hello ${"world"}',
    context: {},
    path: 'input.txt',
    script: '"world"',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: 'world',
    });
  });
});

describe('given script returning object', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '{ test: "q", another: "B" }',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: { test: 'q', another: 'B' },
    });
  });
});

describe('given script returning array', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '["one", "two"]',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: ['one', 'two'],
    });
  });
});

describe('given script returning empty array', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '[]',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: [],
    });
  });
});

describe('given script spreading an object', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '...{ otherProp: "value" }',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'spread',
      values: { otherProp: 'value' },
    });
  });
});

describe('given script spreading an array', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '...[1, 2, 3]',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'spread',
      values: [1, 2, 3],
    });
  });
});

describe('given script returning empty object', () => {
  const params: Params[0] = {
    chunk: 'hello ${ { test: "q" } }',
    context: {},
    path: 'input.txt',
    script: '{}',
    type: 'yaml',
    isAllowedValue: () => true,
  };

  it('should work', () => {
    expect(evaluate(params)).toEqual({
      action: 'set',
      newValue: {},
    });
  });
});

describe('when script doesnt evaluate to a valid value', () => {
  const invalidScripts = {
    'a function': 'console.log',
    'an undefined': 'undefined',
    'a null': 'null',
    'a number': '1',
  };

  const params: Params[0] = {
    chunk: 'hello ${console.log}',
    context: {},
    path: 'input.txt',
    script: '',
    type: 'yaml',
    isAllowedValue: value =>
      (typeof value === 'object' && value !== null) ||
      Array.isArray(value) ||
      typeof value === 'string',
  };

  for (const [key, val] of Object.entries(invalidScripts)) {
    const paramsToTest = {
      ...params,
      script: val,
    };

    it(`for ${key}, should remove`, () => {
      expect(evaluate(paramsToTest)).toEqual({
        action: 'remove',
      });
    });
  }
});

describe('given no template in the source', () => {
  const chunk = 'First line\nSome text value here without template\nLast line';

  it('should ignore', () => {
    const visitor = internals.buildEvaluateLeafCb(
      chunk,
      {
        context: {},
        path: 'input.yaml',
        type: 'yaml',
      },
      () => true
    );
    expect(visitor('Some text value here without template', '[1]')).toEqual({
      action: 'ignore',
    });
  });
});

describe('given template in the source', () => {
  const chunk = 'First line\nSome text value here ${withTemplate}\nLast line';

  it('should ignore', () => {
    const visitor = internals.buildEvaluateLeafCb(
      chunk,
      {
        context: {
          withTemplate: 'with template',
        },
        path: 'input.yaml',
        type: 'yaml',
      },
      () => true
    );
    expect(visitor('${withTemplate}', '[1]')).toEqual({
      action: 'set',
      newValue: 'with template',
    });
  });
});
