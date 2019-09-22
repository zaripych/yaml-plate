import {
  Observable,
  defer,
  from,
  of,
  ConnectableObservable,
  concat,
  ObservedValueOf,
  merge,
  never,
  bindNodeCallback,
  empty,
} from 'rxjs';
import {
  map,
  ignoreElements,
  switchMap,
  concatMap,
  groupBy,
  mergeMap,
  concatAll,
  publish,
  buffer,
  take,
  finalize,
  takeLast,
  startWith,
} from 'rxjs/operators';
import { dirname } from 'path';
import { ensureDir, createWriteStream } from 'fs-extra';
import { IOutputEntry } from './types';
import { EOL } from 'os';
import { outputPath } from './outputPath';

function createStreamApi(path: string, encoding: string) {
  const outStream = createWriteStream(path, {
    encoding,
  });

  const write = bindNodeCallback(outStream.write.bind(outStream) as (
    chunk: string,
    encoding: string,
    cb: (err: Error | null | undefined) => void
  ) => boolean);

  const end = bindNodeCallback(outStream.end.bind(outStream) as (
    cb: (err: Error | null | undefined) => void
  ) => void);

  const close = () => {
    outStream.close();
  };

  return {
    write,
    end,
    close,
  };
}

const concatYamls = () => {
  return (source: Observable<Observable<string>>) =>
    source.pipe(
      concatMap(
        (file, index) =>
          new Observable<string>(subscriber => {
            const shared = file.pipe(publish()) as ConnectableObservable<
              string
            >;
            const hasEOL = shared.pipe(
              takeLast(1),
              switchMap(last => of(last.endsWith(EOL)))
            );

            const data = shared.pipe(stream =>
              index > 0 ? stream.pipe(startWith(`---${EOL}`)) : stream
            );

            const result = concat(
              data,
              hasEOL.pipe(switchMap(has => (!has ? of(EOL) : empty())))
            );

            subscriber.add(result.subscribe(subscriber));
            subscriber.add(shared.connect());
          })
      )
    );
};

const writeCombinedYamlToFile = (
  path: string,
  { encoding = 'utf8' }: { encoding?: string } = {}
) => {
  return (source: Observable<Observable<string>>) => {
    return new Observable<never>(subscriber => {
      const api = createStreamApi(path, encoding);

      const result = source.pipe(
        concatYamls(),
        concatMap(chunk => api.write(chunk, encoding)),
        stream => concat(stream, api.end()),
        ignoreElements(),
        finalize(() => api.close())
      );

      subscriber.add(result.subscribe(subscriber));
    });
  };
};

const writeMultipleToFile = (
  path: string,
  { encoding = 'utf8' }: { encoding?: string } = {}
) => {
  return (source: Observable<Observable<string>>) => {
    return new Observable<never>(subscriber => {
      const api = createStreamApi(path, encoding);

      const result = source.pipe(
        concatAll(),
        concatMap(chunk => api.write(chunk, encoding)),
        stream => concat(stream, api.end()),
        ignoreElements(),
        finalize(() => {
          api.close();
        })
      );

      subscriber.add(result.subscribe(subscriber));
    });
  };
};

const writeSingleToFile = (
  path: string,
  params?: { encoding?: string; highWaterMark?: number }
) => {
  return (stream: Observable<string>) =>
    of(stream).pipe(writeMultipleToFile(path, params));
};

export const writeContentsToDirectory = (
  outDir: string,
  {
    baseDir = '',
    encoding = 'utf8',
    maximumFilesOpen = 5,
  }: {
    baseDir?: string;
    encoding?: string;
    maximumFilesOpen?: number;
  } = {}
) => {
  const writeContentsToDirectoryOperator = (source: Observable<IOutputEntry>) =>
    source.pipe(
      map(arg => {
        const destinationPath = outputPath(outDir, arg.path, baseDir);
        return {
          ...arg,
          destinationPath,
          dirPath: dirname(destinationPath),
        };
      }),
      groupBy(summary => summary.dirPath),
      mergeMap(
        arg =>
          new Observable<ObservedValueOf<typeof arg>>(subscriber => {
            const grouped = arg.pipe(publish()) as ConnectableObservable<
              ObservedValueOf<typeof arg>
            >;
            const ensureDirOp = defer(() => from(ensureDir(arg.key))).pipe(
              publish()
            ) as ConnectableObservable<unknown>;

            const result = concat(
              merge(
                ensureDirOp.pipe(ignoreElements()),
                merge(grouped, never()).pipe(
                  buffer(ensureDirOp),
                  take(1),
                  concatAll(),
                  stream => concat(stream, grouped)
                )
              )
            );

            subscriber.add(result.subscribe(subscriber));
            subscriber.add(grouped.connect());
            subscriber.add(ensureDirOp.connect());
          })
      ),
      mergeMap(
        arg =>
          arg.contents.pipe(
            writeSingleToFile(arg.destinationPath, {
              encoding,
            })
          ),
        maximumFilesOpen
      ),
      ignoreElements()
    );
  return writeContentsToDirectoryOperator;
};

export const writeCombinedYaml = (
  outFilePath: string,
  params: { encoding?: string } = {}
) => {
  const writeCombinedOperator = (stream: Observable<Observable<string>>) =>
    new Observable(subscriber => {
      const outDir = dirname(outFilePath);

      const shared = stream.pipe(publish()) as ConnectableObservable<
        Observable<string>
      >;
      const ensureDirOp = defer(() => from(ensureDir(outDir))).pipe(
        publish()
      ) as ConnectableObservable<unknown>;

      const result = merge(
        ensureDirOp.pipe(ignoreElements()),
        merge(shared, never()).pipe(
          buffer(ensureDirOp),
          take(1),
          switchMap(collected =>
            concat(from(collected), shared).pipe(
              writeCombinedYamlToFile(outFilePath, params)
            )
          )
        )
      );

      subscriber.add(result.subscribe(subscriber));
      subscriber.add(shared.connect());
      subscriber.add(ensureDirOp.connect());
    });
  return writeCombinedOperator;
};

export const writeStdOut = () => {
  return (stream: Observable<Observable<string>>) => {
    return new Observable<never>(subscriber => {
      const shared = stream.pipe(
        concatAll(),
        publish()
      ) as ConnectableObservable<string>;
      subscriber.add(
        shared.subscribe({
          next: data => {
            process.stdout.write(data);
          },
          error: err => subscriber.error(err),
          complete: () => subscriber.complete(),
        })
      );
      subscriber.add(shared.connect());
    });
  };
};
