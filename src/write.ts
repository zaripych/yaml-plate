import { Observable, defer, from, of, fromEvent } from 'rxjs';
import {
  map,
  ignoreElements,
  switchMap,
  concatMap,
  groupBy,
  mergeMap,
} from 'rxjs/operators';
import { dirname, join, relative } from 'path';
import { ensureDir, createWriteStream } from 'fs-extra';
import { rxToStream } from 'rxjs-stream';
import { IOutputEntry } from './types';

const writeMultipleToFile = (
  path: string,
  {
    encoding = 'utf8',
    highWaterMark,
  }: { encoding?: string; highWaterMark?: number } = {}
) => {
  return (stream: Observable<Observable<string>>) => {
    return new Observable<never>(subscriber => {
      const writeStream = createWriteStream(path, {
        encoding,
      });

      stream
        .pipe(
          concatMap(chunk =>
            fromEvent(
              rxToStream(chunk, {
                encoding,
                ...(typeof highWaterMark === 'number' && {
                  highWaterMark,
                }),
              }).pipe(
                writeStream,
                { end: false }
              ),
              'close'
            ).pipe(ignoreElements())
          )
        )
        .subscribe(subscriber);
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
    highWaterMark,
    maximumFilesOpen = 5,
  }: {
    baseDir?: string;
    encoding?: string;
    highWaterMark?: number;
    maximumFilesOpen?: number;
  } = {}
) => {
  const writeContentsToDirectoryOperator = (stream: Observable<IOutputEntry>) =>
    stream.pipe(
      map(arg => {
        const destinationPath = join(outDir, relative(baseDir, arg.path));
        return {
          ...arg,
          destinationPath,
          dirPath: dirname(destinationPath),
        };
      }),
      groupBy(summary => summary.dirPath),
      concatMap(arg => from(ensureDir(arg.key)).pipe(switchMap(() => arg))),
      mergeMap(
        arg =>
          arg.contents.pipe(
            writeSingleToFile(arg.destinationPath, { encoding, highWaterMark })
          ),
        maximumFilesOpen
      ),
      ignoreElements()
    );
  return writeContentsToDirectoryOperator;
};

export const writeCombined = (
  outFilePath: string,
  params: { encoding?: string; highWaterMark?: number } = {}
) => {
  const writeCombinedOperator = (stream: Observable<Observable<string>>) =>
    defer(() => from(ensureDir(dirname(outFilePath)))).pipe(
      switchMap(() => stream.pipe(writeMultipleToFile(outFilePath, params))),
      ignoreElements()
    );
  return writeCombinedOperator;
};
