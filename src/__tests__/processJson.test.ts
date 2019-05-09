import { internals } from '@src/eval';

describe('given invalid json', () => {
  const chunk = `{
  "comments": \${comments}
}`;

  const renderParams = {
    context: {},
    path: 'template.json',
  };

  it('should throw', () => {
    expect(() =>
      internals.processJson(chunk, {
        ...renderParams,
        type: 'json',
      })
    ).toThrow('Unexpected token $ in JSON at position 16');
  });
});

describe('given valid json with simple top level property', () => {
  const chunk = `{
  "title": "Master and Margarita",
  "year": "1966",
  "comments" :"\${comments}"
}`;
  const renderParams = {
    context: {
      comments: ['A masterpiece!', 'Not relevant anymore', 'Clever'],
    },
    path: 'template.yaml',
  };

  it('should work', () => {
    expect(
      JSON.parse(
        internals.processJson(chunk, {
          ...renderParams,
          type: 'json',
        })
      )
    ).toEqual({
      title: 'Master and Margarita',
      year: '1966',
      comments: ['A masterpiece!', 'Not relevant anymore', 'Clever'],
    });
  });
});

describe('given valid json with a second level property', () => {
  const chunk = `{
  "device": {
    "brand": "ASUS",
    "madeIn": "China",
    "model": "\${model}"        
  }
}`;
  const renderParams = {
    context: {
      model: 'ASUS ROG WHATEVER123',
    },
    path: 'template.yaml',
  };

  it('should work', () => {
    expect(
      JSON.parse(
        internals.processJson(chunk, {
          ...renderParams,
          type: 'json',
        })
      )
    ).toEqual({
      device: {
        brand: 'ASUS',
        madeIn: 'China',
        model: 'ASUS ROG WHATEVER123',
      },
    });
  });
});
