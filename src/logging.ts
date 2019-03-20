export const warning = (message?: string, ...args: unknown[]) => {
  console.warn('plate: ', message, ...args);
};

export const error = (message?: string, ...args: unknown[]) => {
  console.error('plate: ', message, ...args);
};

export const verbose = (message?: string, ...args: unknown[]) => {
  console.log('plate: ', message, ...args);
};
