import { evalContents } from '@src/eval';
import { marbles, Context } from 'rxjs-marbles/jest';
import { IInputEntry, IOutputEntry } from 'src/types';

describe('evalContents', () => {
  describe('given empty stream', () => {
    it(
      'should produce an empty stream',
      marbles(m => {
        const source = m.hot('-^|-'); // prettier-ignore
        const subs =          '^!'; // prettier-ignore
        const expected =     '-^|-'; // prettier-ignore

        const result = source.pipe(evalContents({}));

        m.expect(result).toBeObservable(expected);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given infinite stream', () => {
    it(
      'should never unsubscribe',
      marbles(m => {
        const source = m.hot('-^--'); // prettier-ignore
        const subs =          '^'; // prettier-ignore
        const expected =     '-^--'; // prettier-ignore

        const result = source.pipe(evalContents({}));

        m.expect(result).toBeObservable(expected);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });

  describe('given single entry', () => {
    const input = (m: Context): { [key: string]: IInputEntry } => ({
      i: {
        type: 'yaml',
        contents: m.cold('|'),
        path: 'test.yaml',
      },
    });

    const output: { [key: string]: IOutputEntry } = {
      o: {
        type: 'yaml',
        contents: '[empty]' as any,
        path: 'test.yaml',
      },
    };

    const deps: typeof evalContents.deps = {
      renderJsonAndYaml: jest.fn(() => () => '[empty]') as any,
    };

    it(
      'should produce single entry',
      marbles(m => {
        const source = m.hot('-^i|', input(m)); // prettier-ignore
        const subs =          '^-!'; // prettier-ignore
        const expected =     '-^o|'; // prettier-ignore

        const result = source.pipe(evalContents({}, deps));

        m.expect(result).toBeObservable(expected, output);
        m.expect(source).toHaveSubscriptions(subs);
      })
    );
  });
});
