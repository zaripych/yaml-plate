export default async () => {
  return new Promise((res, _rej) => {
    setTimeout(() => {
      res({
        usefulConstant: '1',
      });
    }, 0);
  });
};
