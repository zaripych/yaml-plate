import { internals } from '@src/eval';

describe('given valid json with a simple top level property', () => {
  const chunk = JSON.stringify(
    {
      title: 'Test JSON Document',
      created: '${created}',
    },
    undefined,
    '  '
  );
  const renderParams = {
    context: {
      created: 2019,
    },
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(
      JSON.stringify(
        {
          title: 'Test JSON Document',
          created: 2019,
        },
        undefined,
        '  '
      )
    );
  });
});

describe('given valid json with a second level property', () => {
  const chunk = JSON.stringify(
    {
      attributes: {
        private: 'maybe',
        author: '${author}',
      },
    },
    undefined,
    '  '
  );
  const renderParams = {
    context: {
      author: 'Mark',
    },
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(
      JSON.stringify(
        {
          attributes: {
            private: 'maybe',
            author: 'Mark',
          },
        },
        undefined,
        '  '
      )
    );
  });
});

describe('given valid json with an array property', () => {
  const chunk = JSON.stringify(
    {
      attributes: {
        tags: '${tags}',
      },
    },
    undefined,
    '  '
  );
  const renderParams = {
    context: {
      tags: ['draft', 'wip'],
    },
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(
      JSON.stringify(
        {
          attributes: {
            tags: ['draft', 'wip'],
          },
        },
        undefined,
        '  '
      )
    );
  });
});

describe('given valid json with spreaded array', () => {
  const chunk = JSON.stringify(
    {
      contributors: ['Rick', 'Morty', '${...otherContributors}'],
    },
    undefined,
    '  '
  );
  const renderParams = {
    context: {
      otherContributors: ['Mr. President', 'Beth Smith'],
    },
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(
      JSON.stringify(
        {
          contributors: ['Rick', 'Morty', 'Mr. President', 'Beth Smith'],
        },
        undefined,
        '  '
      )
    );
  });
});

describe('given valid json with spreaded object', () => {
  const chunk = JSON.stringify(
    {
      parameters: {
        price: '$100',
        spreadPlaceholder: '${...parameters}',
      },
    },
    undefined,
    '  '
  );
  const renderParams = {
    context: {
      parameters: {
        color: 'white',
        size: 'xs',
      },
    },
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(
      JSON.stringify(
        {
          parameters: {
            price: '$100',
            color: 'white',
            size: 'xs',
          },
        },
        undefined,
        '  '
      )
    );
  });
});

describe('given valid empty json', () => {
  const chunk = `{}`;
  const renderParams = {
    context: {},
    path: 'template.json',
    type: 'json' as const,
  };

  it('should work', () => {
    expect(internals.processJson(chunk, renderParams)).toEqual(`{}`);
  });
});
