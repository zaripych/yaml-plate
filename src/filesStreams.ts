import { from, Observable, defer } from 'rxjs';
import { map } from 'rxjs/operators';
import { streamToRx } from 'rxjs-stream';
import { readFile } from 'fs-extra';
import { extname } from 'path';
import fg from 'fast-glob';
import { IInputEntry, SourceType } from './types';

const readFileStream = (path: string, encoding: string): Observable<string> => {
  return defer(() => from(readFile(path, { encoding })));
};

export const filePathStream = (patterns: string | string[]) => {
  return (streamToRx(
    fg.stream(patterns, {
      onlyFiles: true,
      unique: true,
    })
  ) as unknown) as Observable<string>;
};

const typeFromExtensionMap: {
  [key: string]: SourceType | undefined;
} = {
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
};

export const typeFromPath = (path: string): SourceType => {
  const ext = extname(path);
  const type = typeFromExtensionMap[ext];
  if (!type) {
    throw new Error(`Unknown file extension ${ext}`);
  }
  return type;
};

export const fileContentsStream = (
  pattern: string | string[],
  encoding = 'utf8'
): Observable<IInputEntry> =>
  filePathStream(pattern).pipe(
    map(path => ({
      path,
      type: typeFromPath(path),
      contents: readFileStream(path, encoding),
    }))
  );
