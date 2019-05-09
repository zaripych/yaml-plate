module.exports = function(wallaby) {
  const babel = wallaby.compilers.babel({
    babel: require('@babel/core'),
  });

  return {
    files: ['src/**/*.ts', 'src/**/*.js', '!src/**/__tests__/**/*.test.ts'],

    tests: ['src/**/__tests__/**/*.test.ts'],

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest',

    preprocessors: {
      'src/**/*.js': babel,
    },

    hints: {
      ignoreCoverage: /istanbul ignore next/,
    },

    debug: true,
  };
};
