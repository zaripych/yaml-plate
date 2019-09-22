import { internals } from '@src/eval';

describe('given valid yaml with simple top level property', () => {
  const chunk = `title: Test Yaml document
created: '\${created.toFixed(0)}'`;
  const renderParams = {
    context: {
      created: 2019,
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams))
      .toEqual(`title: Test Yaml document
created: '2019'
`);
  });
});

describe('given valid yaml with a second level property', () => {
  const chunk = `attributes:
  private: maybe
  author: '\${author}'`;
  const renderParams = {
    context: {
      author: 'Mark',
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams)).toEqual(`attributes:
  private: maybe
  author: Mark
`);
  });
});

describe('given valid yaml with an array property', () => {
  const chunk = `attributes:
  tags: '\${tags}'`;
  const renderParams = {
    context: {
      tags: ['draft', 'wip'],
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams)).toEqual(`attributes:
  tags:
    - draft
    - wip
`);
  });
});

describe('given valid yaml with spreaded array', () => {
  const chunk = `contributors:
  - Rick
  - Morty
  - '\${...otherContributors}'
`;
  const renderParams = {
    context: {
      otherContributors: ['Mr. President', 'Beth Smith'],
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams)).toEqual(`contributors:
  - Rick
  - Morty
  - Mr. President
  - Beth Smith
`);
  });
});

describe('given valid yaml with spreaded object', () => {
  const chunk = `parameters:
  price: $100
  otherParameters: \${...parameters}
`;
  const renderParams = {
    context: {
      parameters: {
        color: 'white',
        size: 'xs',
      },
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams)).toEqual(`parameters:
  price: $100
  color: white
  size: xs
`);
  });
});

describe('given valid yaml with two documents', () => {
  const chunk = `title: First document
id: \${firstId}
---
title: Second document
id: \${secondId}
`;
  const renderParams = {
    context: {
      firstId: '0',
      secondId: '1',
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams))
      .toEqual(`title: First document
id: '0'
---
title: Second document
id: '1'
`);
  });
});

describe('given valid yaml with empty documents', () => {
  const chunk = `title: First document
---
---
title: Third document
`;
  const renderParams = {
    context: {},
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams))
      .toEqual(`title: First document
---
---
title: Third document
`);
  });
});

describe('given valid yaml with multiple values', () => {
  const chunk = `title: Test Yaml document
description: Single text value without template
created: '\${"2019"}'
attributes:
  private: maybe
  license: MIT
  author: '\${author}'
  tags: '\${tags}'
---
title: Next Document
`;
  const renderParams = {
    context: {
      author: 'Mark',
      tags: ['draft', 'wip'],
    },
    path: 'template.yaml',
    type: 'yaml' as const,
  };

  it('should work', () => {
    expect(internals.processYaml(chunk, renderParams))
      .toEqual(`title: Test Yaml document
description: Single text value without template
created: '2019'
attributes:
  private: maybe
  license: MIT
  author: Mark
  tags:
    - draft
    - wip
---
title: Next Document
`);
  });
});
