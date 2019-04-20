import { Observable } from 'rxjs';
import { map, reduce } from 'rxjs/operators';
import { EOL } from 'os';

const ensureEOL = (text?: string) =>
  text && text.endsWith(EOL) ? text : `${text}${EOL}`;

const combineContents = () => {
  const f = (stream: Observable<{ path: string; contents: string }>) =>
    stream.pipe(
      map(arg => arg.contents),

      reduce((acc, value) => {
        return acc && value
          ? `${ensureEOL(acc)}---${EOL}${ensureEOL(value)}`
          : acc || value;
      }, '')
    );
  return f;
};

module.exports = {
  combineContents,
};
