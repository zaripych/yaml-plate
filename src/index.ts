import { evalContents } from './eval';
import { fileContentsStream } from './filesStreams';
import { Observable, from, defer } from 'rxjs';
import {
  IEvaluateConfig,
  IOutputEntry,
  Input,
  IInputPattern,
  InputStream,
} from './types';
import { resolveContext } from './resolveContext';
import {
  switchMap,
  catchError,
  map,
  groupBy,
  mergeAll,
  ignoreElements,
  reduce,
} from 'rxjs/operators';
import {
  writeCombinedYaml,
  writeContentsToDirectory,
  writeStdOut,
} from './write';

const compareStrings = (a: string, b: string) => (a === b ? 0 : a > b ? 1 : -1);

function asPattern(input?: Input): IInputPattern | null {
  return typeof input === 'string'
    ? {
        pattern: input,
      }
    : (typeof input === 'object' &&
        input !== null &&
        'pattern' in input &&
        input) ||
        null;
}

function asStream(input?: Input): InputStream | null {
  return (
    (typeof input !== 'string' &&
      typeof input === 'object' &&
      input !== null &&
      'pipe' in input &&
      input) ||
    null
  );
}

function sortConditionally<T>(sort: boolean, compare: (a: T, b: T) => number) {
  return (stream: Observable<T>) =>
    sort
      ? stream.pipe(
          reduce((acc, item) => [...acc, item], []),
          switchMap(buffer => {
            buffer.sort(compare);
            return buffer;
          })
        )
      : stream;
}

export const processInput = (
  params: IEvaluateConfig
): Observable<IOutputEntry> => {
  return defer(() =>
    from(resolveContext(params.context)).pipe(
      catchError(err => {
        throw err;
      }),
      switchMap(context => {
        const pattern = asPattern(params.input);

        const inputStream = asStream(params.input);

        const stream =
          (pattern && fileContentsStream(pattern.pattern)) || inputStream;

        if (!stream) {
          throw new Error(
            'The .input is not a pattern, neither it is an RxJs 6 Observable, cannot continue'
          );
        }

        const shouldSort = (pattern && pattern.sorted) || false;

        return stream.pipe(
          sortConditionally(shouldSort, (a, b) =>
            compareStrings(a.path, b.path)
          ),
          evalContents(context)
        );
      })
    )
  );
};

export const writeOutput = (params: IEvaluateConfig) => {
  return (stream: Observable<IOutputEntry>) => {
    return stream.pipe(
      groupBy(item => item.type),
      map(group => {
        if (typeof params.output !== 'object' || params.output === null) {
          throw new Error('.output is not an object');
        }

        if (
          'file' in params.output &&
          typeof params.output.file === 'string' &&
          params.output.file
        ) {
          if (group.key !== 'yaml') {
            throw new Error('Only can write yaml into a single combined file');
          }
          return group.pipe(
            map(item => item.contents),
            writeCombinedYaml(params.output.file)
          );
        } else if (
          'directory' in params.output &&
          typeof params.output.directory === 'string' &&
          params.output.directory
        ) {
          return group.pipe(
            writeContentsToDirectory(params.output.directory, {
              ...(typeof params.output.baseDir === 'string' && {
                baseDir: params.output.baseDir,
              }),
            })
          );
        } else if ('stdout' in params.output && params.output.stdout === true) {
          return group.pipe(
            map(item => item.contents),
            writeStdOut()
          );
        } else {
          throw new Error('.output is not a directory or file');
        }
      }),
      mergeAll(),
      ignoreElements()
    );
  };
};

export const evaluate = (params: IEvaluateConfig) => {
  const process = processInput(params).pipe(writeOutput(params));
  return new Promise<void>((res, rej) => {
    const sub = process.subscribe({
      error: rej,
      complete: () => {
        sub.unsubscribe();
        res();
      },
    });
  });
};
