import { internals } from '@src/eval';
import { marbles } from 'rxjs-marbles/jest';

const renderJsonAndYaml = internals.renderJsonAndYaml;

describe('renderJsonAndYaml', () => {
  const params: Parameters<typeof renderJsonAndYaml>[0] = {
    context: {},
    path: '/some/file/path.yaml',
    type: 'yaml',
  };

  describe('given invalid parameters', () => {
    it(
      'should produce an empty stream',
      marbles(m => {
        const source = m.hot('-^a|-'); // prettier-ignore
        const subs =          '^-!'; // prettier-ignore
        const expected =     '-^-#-'; // prettier-ignore

        const result = source.pipe(
          renderJsonAndYaml({
            ...params,
            type: 'unknown' as any,
          })
        );

        m.expect(result).toBeObservable(
          expected,
          undefined,
          new Error('Invalid content type')
        );
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given empty stream', () => {
    it(
      'should produce an empty stream',
      marbles(m => {
        const source = m.hot('-^|-'); // prettier-ignore
        const subs =          '^!'; // prettier-ignore
        const expected =     '-^|-'; // prettier-ignore

        const result = source.pipe(renderJsonAndYaml(params));

        m.expect(result).toBeObservable(expected);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given infinite empty stream', () => {
    it(
      'should never unsubscribe',
      marbles(m => {
        const source = m.hot('-^--'); // prettier-ignore
        const subs =          '^--'; // prettier-ignore
        const expected =     '-^--'; // prettier-ignore

        const result = source.pipe(renderJsonAndYaml(params));

        m.expect(result).toBeObservable(expected);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given single yaml entry', () => {
    const input = {
      i: 'fileName: something',
    };
    const output = {
      o: 'fileName: something\n',
    };

    it(
      'should work',
      marbles(m => {
        const source = m.hot('-^i|', input); // prettier-ignore
        const subs =          '^-!'; // prettier-ignore
        const expected =     '-^-(o|)'; // prettier-ignore

        // there is one empty frame in `expected` because we
        // need to wait for the input entries to be complete first
        // before we can start parsing yaml/json

        // this could be improved later by waiting for a `---` delimiter for
        // yaml files

        const result = source.pipe(renderJsonAndYaml(params));

        m.expect(result).toBeObservable(expected, output);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given single json entry', () => {
    const input = {
      i: '{ "fileName": "something" }',
    };
    const output = {
      o: '{\n  "fileName": "something"\n}',
    };

    it(
      'should work',
      marbles(m => {
        const source = m.hot('-^i|', input); // prettier-ignore
        const subs =          '^-!'; // prettier-ignore
        const expected =     '-^-(o|)'; // prettier-ignore

        const result = source.pipe(
          renderJsonAndYaml({
            ...params,
            type: 'json',
          })
        );

        m.expect(result).toBeObservable(expected, output);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });
});
