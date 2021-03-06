import { IEvaluateConfig, EvaluatedObjectCtx, FnCtx } from './types';
import { resolve as resolvePath } from 'path';

function interopRequireDefault<T>(
  obj: T | { __esModule: true; default: T } | undefined
): { default: T | undefined } {
  if (!obj) {
    return {
      default: obj,
    };
  }
  if ('__esModule' in obj && obj.__esModule === true) {
    return obj;
  }
  return { default: obj as T };
}

function resolve(context?: EvaluatedObjectCtx | FnCtx) {
  if (typeof context === 'object' && context !== null) {
    return Promise.resolve(context);
  }

  if (typeof context === 'function') {
    return Promise.resolve(context() as {});
  }

  return Promise.resolve({});
}

export async function resolveContext(
  context?: IEvaluateConfig['context']
): Promise<EvaluatedObjectCtx> {
  if (typeof context === 'string') {
    const result = interopRequireDefault<EvaluatedObjectCtx | FnCtx>(
      // eslint-disable-next-line
      require(resolvePath(context)) as {}
    ).default;

    return resolve(result);
  }

  return resolve(context);
}
