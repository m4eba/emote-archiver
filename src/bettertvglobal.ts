import fetch from 'node-fetch';
import { Emote } from './emote';
import { Context, diffSave } from './utils';

export default async function bettertvglobal(
  context: Context
): Promise<Emote[]> {
  const resp = await fetch('https://api.betterttv.net/3/cached/emotes/global');
  const data = await resp.json();
  const result: Array<Emote> = [];
  for (let i = 0; i < data.length; ++i) {
    const e = data[i];

    [1, 2, 3].forEach((zoom) => {
      result.push({
        name: e.id + '-' + zoom,
        url: `https://cdn.betterttv.net/emote/${e.id}/${zoom}x`,
        ext: e.imageType,
      });
    });
  }

  const writeOut = await diffSave(
    context.out,
    'bettertv',
    JSON.stringify(data, null, ' ')
  );
  if (writeOut) {
    return result;
  }
  return [];
}
