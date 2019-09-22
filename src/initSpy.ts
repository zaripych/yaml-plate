import { create } from 'rxjs-spy';

const spy = create();

spy.log(/debug-.+/);

((global as unknown) as { [key: string]: unknown }).spy = spy;
