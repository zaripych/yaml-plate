export default async () => {
  return new Promise((_res, rej) => {
    setTimeout(() => {
      rej(new Error(`I'm a bad module`));
    }, 0);
  });
};
