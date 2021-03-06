import fetch from 'node-fetch';
import { Emote } from './emote';
import { Context, diffSave } from './utils';

export default async function seventv(context: Context): Promise<Emote[]> {
  const resp = await fetch(
    `https://api.7tv.app/v2/users/${context.name}/emotes`
  );
  const data = await resp.json();
  const result: Array<Emote> = [];
  for (let i = 0; i < data.length; ++i) {
    const e = data[i];

    e.urls.forEach((url: string[2]) => {
      result.push({
        name: e.id + '-' + url[0],
        url: url[1],
        ext: e.mime.substring(6),
      });
    });
  }

  const writeOut = await diffSave(
    context.out,
    '7tv',
    JSON.stringify(data, null, ' ')
  );
  if (writeOut) {
    return result;
  }
  return [];
}
