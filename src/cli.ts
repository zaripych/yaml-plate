import yargs from 'yargs';
import { evaluate } from './index';

const y = yargs
  .option('c' as const, {
    alias: 'context' as const,
    string: true,
    description: 'Context JS file to inject into templates',
    required: false,
    default: './plate.context.js',
  })
  .option('p' as const, {
    alias: 'pattern' as const,
    string: true,
    description: 'Glob pattern for Yaml/Json files to combine and eval',
    required: true,
  })
  .option('d' as const, {
    alias: 'out-dir' as const,
    string: true,
    description: 'Output to directory',
    required: false,
    conflicts: 's',
  })
  .option('b' as const, {
    alias: 'base-dir' as const,
    string: true,
    description:
      'Flatten directory output up to the specified directory, only effective when out-dir is specified',
    required: false,
    implies: 'd',
  })
  .option('s' as const, {
    alias: 'single-file' as const,
    string: true,
    description: 'Path to combined yaml file',
    required: false,
    conflicts: 'd',
  })
  .option('sorted' as const, {
    boolean: true,
    description:
      'Process files in deterministic sorted order [this is for integration testing purposes only]',
    required: false,
  })
  .parse();

process.setUncaughtExceptionCaptureCallback(err => {
  console.error('', err);
});

async function start() {
  await evaluate({
    context: y.c,
    input: {
      pattern: y.p,
      sorted: y.sorted,
    },
    output:
      typeof y.d === 'string' && y.d
        ? {
            directory: y.d,
            ...(y.b && {
              baseDir: y.b,
            }),
          }
        : (y.s && {
            file: y.s,
          }) || {
            stdout: true,
          },
  });
}

start()
  .then(() => {
    process.exitCode = 0;
  })
  .catch(err => {
    process.exitCode = 1;
    console.error('', err);
  });
