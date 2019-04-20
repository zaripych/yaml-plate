// tslint:disable-next-line:no-any
function isIterable(obj: any): obj is Iterable<unknown> {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

// tslint:disable-next-line:interface-over-type-literal
type TraversableObject = {
  [key: string]: unknown;
};

type Traversable = TraversableObject | unknown[];

interface ISetAction {
  action: 'set';
  newValue: unknown;
}

interface ISpreadAction {
  action: 'spread';
  values: Iterable<unknown> | {};
}

interface IRemoveAction {
  action: 'remove';
}

interface IIgnoreAction {
  action: 'ignore';
}

export type TraverseAction =
  | ISetAction
  | ISpreadAction
  | IRemoveAction
  | IIgnoreAction;

export type LeafVisitor = (value: string, path: string) => TraverseAction;

function actOnObject(
  current: TraversableObject,
  key: string,
  value: unknown,
  valuePath: string,
  set: Set<Traversable>,
  next: Array<{ path: string; current: Traversable }>,
  leafVisitor: LeafVisitor
) {
  if ((typeof value === 'object' || Array.isArray(value)) && !!value) {
    if (set.has(value)) {
      throw new Error(
        'An object with recursive references found, cannot continue evaluation'
      );
    }

    next.push({
      path: valuePath,
      current: value,
    });
    set.add(value);
  } else if (typeof value === 'string') {
    const result = leafVisitor(value, valuePath);

    if (result.action === 'set') {
      current[key] = result.newValue;
    } else if (result.action === 'spread') {
      if (typeof result.values !== 'object' || result.values === null) {
        return;
      }
      delete current[key];
      Object.assign(current, result.values);
    } else if (result.action === 'remove') {
      delete current[key];
    }
  }
}

function actOnArray(
  current: unknown[],
  i: number,
  value: unknown,
  valuePath: string,
  set: Set<Traversable>,
  next: Array<{ path: string; current: Traversable }>,
  leafVisitor: LeafVisitor
): number {
  if ((typeof value === 'object' || Array.isArray(value)) && !!value) {
    if (set.has(value)) {
      throw new Error(
        'An object with recursive references found, cannot continue evaluation'
      );
    }

    next.push({
      path: valuePath,
      current: value,
    });
    set.add(value);
  } else if (typeof value === 'string') {
    const result = leafVisitor(value, valuePath);

    if (result.action === 'set') {
      current[i] = result.newValue;
    } else if (result.action === 'spread') {
      if (!Array.isArray(result.values) && !isIterable(result.values)) {
        return i;
      }

      const toSpread = Array.from(result.values as Iterable<unknown>);
      current.splice(i, 1, ...toSpread);
      i -= 1;
      i += toSpread.length;
    } else if (result.action === 'remove') {
      current.splice(i, 1);
      i -= 1;
    }
  }

  return i;
}

export const traverseAndMutate = (
  instance: Traversable,
  leafVisitor: LeafVisitor
) => {
  // stack of objects (to reduce call stack size and remove recursion)
  const next: Array<{
    path: string;
    current: Traversable;
  }> = [
    {
      path: '',
      current: instance,
    },
  ];
  const set = new Set();

  while (next.length > 0) {
    const { path, current } = next[0];

    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i += 1) {
        const value = current[i];
        const valuePath = `${path}[${i}]`;

        i = actOnArray(current, i, value, valuePath, set, next, leafVisitor);
      }
    } else {
      for (const [key, value] of Object.entries(current)) {
        const valuePath = `${path}.${key}`;

        actOnObject(current, key, value, valuePath, set, next, leafVisitor);
      }
    }

    next.splice(0, 1);
  }
};
