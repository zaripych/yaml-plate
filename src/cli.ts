import yargs from 'yargs';
import { evaluate } from './index';
import { resolve } from 'path';

const y = yargs
  .option('files', {
    description: 'Glob pattern for Yaml files to combine and eval',
    string: true,
    demandOption: 'Please specify input files glob pattern',
  })
  .option('ctx', {
    description: 'Js file with context to evaluate templates with',
    alias: ['context'],
    string: true,
  })
  .option('d', {
    description: 'Output directory, if not specified will output to stdout',
    alias: ['dir'],
    string: true,
  })
  .option('f', {
    description: 'Output file, if not specified will output to stdout',
    alias: ['file'],
    string: true,
  })
  .option('b', {
    description:
      'when specified, and output is a directory, flattens the output directory structure',
    alias: ['base-dir'],
    string: true,
  })
  .conflicts('f', 'd')
  .example(
    '$0 --files ./kubernetes/**/*.yaml --ctx dev.js -f ./combined.yaml',
    'Collect all Yaml files from ./kubernetes directory and its sub-directories, inject them with variables from dev.js file and write the result into a combined Yaml file at ./combined.yaml'
  )
  .parse();

async function execute() {
  const context = typeof y.ctx === 'string' ? resolve(y.ctx) : {};

  if (y.d) {
    await evaluate({
      context,
      input: y.files,
      output: {
        directory: y.d,
        baseDir: y.b,
      },
    });
  } else if (y.f) {
    await evaluate({
      context,
      input: y.files,
      output: {
        file: y.f,
      },
    });
  } else {
    throw new Error('Invalid arguments');
  }
}

execute().catch(err => {
  console.error('💥 Something went wrong', err);
  process.exit(1);
});
