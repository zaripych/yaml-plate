import vm from 'vm';
import { Observable } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
import yaml from 'js-yaml';
import {
  IInputEntry,
  IOutputEntry,
  EvaluatedObjectCtx,
  SourceType,
} from './types';
import { basename } from 'path';
import { LeafVisitor, TraverseAction, traverseAndMutate } from './traverse';

const EOLRegexp = /\n/g;
const ScriptRegexp = /^\$\{((.|\n)*)(\s|\n)*\}$/m;
const EOL = '\n';

type LocalContext = EvaluatedObjectCtx & {
  // similar to Node.js
  __filename: string;
  __dirname: string;
  // specifics:
  __type: SourceType;
  __path: string;
  __line: number;
  __column: number;
};

// in order to find line and column of a script
// we just search for its entry in the contents
const dumbLineAndColumnFrom = (
  script: string,
  contents: string
): [number, number] => {
  const index = contents.indexOf(script);
  if (index < 0) {
    // we don't know
    return [0, 0];
  }

  const linesBefore = contents.substr(0, index);
  const lines = linesBefore.match(EOLRegexp) || [];
  const lastLineIndex = linesBefore.lastIndexOf(EOL);
  const line = lines.length;
  const col = index - ((lastLineIndex > 0 && lastLineIndex) || 0) - 1;
  return [line, col];
};

const addLazyLineAndColumnOffsetProps = (
  lineKey: string,
  columnKey: string,
  obj: {},
  params: IEvaluateParams
) => {
  let lineAndColumn: [number, number] | null = null;

  Object.defineProperties(obj, {
    [lineKey]: {
      configurable: false,
      enumerable: true,
      writable: false,
      get: () => {
        if (!lineAndColumn) {
          lineAndColumn = dumbLineAndColumnFrom(params.script, params.chunk);
        }
        return lineAndColumn[0];
      },
    },
    [columnKey]: {
      configurable: false,
      enumerable: true,
      writable: false,
      get: () => {
        if (!lineAndColumn) {
          lineAndColumn = dumbLineAndColumnFrom(params.script, params.chunk);
        }
        return lineAndColumn[1];
      },
    },
  });
};

const buildLocalContext = (params: IEvaluateParams): LocalContext => {
  const context: LocalContext = {
    ...params.context,
    __dirname: basename(params.path),
    __filename: params.path,
    __type: params.type,
    __path: params.path,
    __line: 0,
    __column: 0,
  };

  addLazyLineAndColumnOffsetProps('__line', '__column', context, params);

  return context;
};

interface IEvaluateParams extends IRenderParams {
  chunk: string;
  script: string;
  path: string;
}

const evaluate = (params: IEvaluateParams): TraverseAction => {
  const { script, path } = params;

  const spread = script.match(/^\s*(\.\.\.)/);

  const context = Object.freeze(buildLocalContext(params));

  const modifiedScript = (spread && script.substr(spread.length + 1)) || script;

  const options = {
    filename: path,
    lineOffset: 0,
    columnOffset: 0,
  };

  addLazyLineAndColumnOffsetProps(
    'lineOffset',
    'columnOffset',
    options,
    params
  );

  const newValue = vm.runInContext(
    modifiedScript,
    vm.createContext(context),
    options
  );

  if (newValue === null || newValue === undefined) {
    return {
      action: 'remove',
    };
  } else if (spread) {
    if (Array.isArray(newValue) || typeof newValue === 'object') {
      return {
        action: 'spread',
        values: newValue,
      };
    } else {
      return {
        action: 'remove',
      };
    }
  } else {
    return {
      action: 'set',
      newValue,
    };
  }
};

const buildEvaluateLeafCb = (
  chunk: string,
  renderParams: IRenderParams
): LeafVisitor => (val, path) => {
  const scriptRegexResult = ScriptRegexp.exec(val);
  if (!scriptRegexResult || scriptRegexResult.length < 1) {
    return {
      action: 'ignore',
    };
  }

  try {
    const script = scriptRegexResult[1];

    return evaluate({
      chunk,
      script,
      path,
      ...renderParams,
    });
  } catch (err) {
    throw err;
  }
};

const processYaml = (chunk: string, renderParams: IRenderParams) => {
  const loaded = yaml.safeLoadAll(chunk);

  const combined = [];

  const evaluateLeaf: LeafVisitor = buildEvaluateLeafCb(chunk, renderParams);

  for (const doc of loaded) {
    traverseAndMutate(doc, evaluateLeaf);

    combined.push(yaml.dump(doc));
  }

  return combined.join(`${EOL}---${EOL}`);
};

const processJson = (chunk: string, renderParams: IRenderParams) => {
  const doc = JSON.parse(chunk);

  const evaluateLeaf: LeafVisitor = buildEvaluateLeafCb(chunk, renderParams);

  traverseAndMutate(doc, evaluateLeaf);

  return JSON.stringify(doc, undefined, '  ');
};

interface IRenderParams extends Pick<IInputEntry, 'path' | 'type'> {
  context: EvaluatedObjectCtx;
}

const renderJsonAndYaml = (renderParams: IRenderParams) => {
  return (stream: Observable<string>): Observable<string> => {
    return new Observable<string>(subscriber => {
      const results = stream.pipe(
        toArray(),
        map(items => items.join('')),
        map(chunk => {
          if (renderParams.type === 'yaml') {
            return processYaml(chunk, renderParams);
          } else if (renderParams.type === 'json') {
            return processJson(chunk, renderParams);
          } else {
            throw new Error('Invalid content type');
          }
        })
      );

      return results.subscribe(subscriber);
    });
  };
};

export const evalContents = (context: EvaluatedObjectCtx = {}) => {
  const evalContentsOperator = (
    stream: Observable<IInputEntry>
  ): Observable<IOutputEntry> =>
    stream.pipe(
      map(arg => ({
        path: arg.path,
        type: arg.type,
        contents: arg.contents.pipe(
          renderJsonAndYaml({
            path: arg.path,
            type: arg.type,
            context,
          })
        ),
      }))
    );
  return evalContentsOperator;
};
