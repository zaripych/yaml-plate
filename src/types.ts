import { Observable } from 'rxjs';

type GlobPattern = string;

export type SourceType = 'json' | 'yaml';

export interface IInputEntry {
  /**
   * Path to the file the contents are loaded from
   */
  path: string;
  /**
   * Type of the file, depending on the type the way files processed is different
   */
  type: SourceType;
  /**
   * Possibly chunked file contents, must be a cold observable.
   */
  contents: Observable<string>;
}

export interface IOutputEntry {
  /**
   * Path to the file the contents are loaded from
   */
  path: string;
  /**
   * Type of the source file
   */
  type: SourceType;
  /**
   * Processed file contents, this is cold observable, the files are not loaded/processed unless we
   * subscribe to these observables
   */
  contents: Observable<string>;
}

export interface IInputPattern {
  pattern: GlobPattern;
  sorted?: boolean;
}

export type InputStream = Observable<IInputEntry>;

export type Input = GlobPattern | IInputPattern | InputStream;

export type Output =
  | {
      /**
       * Output to a directory with same directory structure as input;
       */
      directory: string;
      /**
       * If the output directory expected to contain only a single directory then it can be eliminated
       * from the output path by specifying it here - used to flatten the output.
       */
      baseDir?: string;
    }
  | {
      /**
       * Output to a combined text file;
       */
      file: string;
    }
  | {
      stdout: true;
    };

export type FilePathCtx = string;

// tslint:disable-next-line:interface-over-type-literal
export type EvaluatedObjectCtx = {};

export type FnCtx = (() => {}) | (() => Promise<{}>);

export type ContextSource = FilePathCtx | EvaluatedObjectCtx | FnCtx;

export interface IEvaluateConfig {
  /**
   * Input templates for evaluation
   *
   * Can be one of the following:
   * - A GLOB pattern of input YAML/JSON files
   * - An Observable stream of file, type of file and its contents
   */
  input: Input;
  /**
   * Specifies the source of a context - an object, properties of which are available to templates during evaluation.
   *
   * Can be one of the following:
   * - string, a path to plate-context.js configuration file
   * - object, an already evaluated object
   * - Function, a function (possibly async) that returns a context object
   */
  context?: ContextSource;
  /**
   * Output of evaluation
   *
   * Can be one of the following:
   * - { directory: string, ... }, outputs to a directory with same directory structure as input;
   * - { file: string, ... }, outputs to a combined file
   */
  output: Output;
}
