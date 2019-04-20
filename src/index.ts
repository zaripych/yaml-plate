import { evalContents } from './eval';
import { fileContentsStream } from './filesStreams';
import { Observable, from, defer } from 'rxjs';
import { IEvaluateConfig, IOutputEntry } from './types';
import { resolveContext } from './resolveContext';
import {
  switchMap,
  catchError,
  map,
  groupBy,
  mergeAll,
  ignoreElements,
  endWith,
} from 'rxjs/operators';
import { writeCombined, writeContentsToDirectory } from './write';

export const processInput = (
  params: IEvaluateConfig
): Observable<IOutputEntry> => {
  return defer(() =>
    from(resolveContext(params.context)).pipe(
      catchError(err => {
        throw new Error(`An error when evaluating context: ${err}`);
      }),
      switchMap(context => {
        const inputStream =
          typeof params.input === 'string'
            ? fileContentsStream(params.input)
            : params.input;

        if (typeof inputStream.pipe !== 'function') {
          throw new Error(
            'The .input is not a string, neither it is an RxJs 6 Observable, cannot continue'
          );
        }

        return inputStream.pipe(evalContents(context));
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
          return group.pipe(
            map(item => item.contents),
            writeCombined(params.output.file)
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
  return processInput(params)
    .pipe(
      writeOutput(params),
      endWith(undefined)
    )
    .toPromise<void>();
};
