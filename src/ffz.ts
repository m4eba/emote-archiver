import fetch from 'node-fetch';
import { Context, diffSave } from './utils';
import { Emote } from './emote';

export default async function ffz(context: Context): Promise<Emote[]> {
  const resp = await fetch(
    `https://api.frankerfacez.com/v1/room/${context.name}`
  );
  const data = await resp.json();
  // remove usage count from data
  const result = new Array<Emote>();
  for (const key in data.sets) {
    const set = data.sets[key];
    for (let i = 0; i < set.emoticons.length; ++i) {
      delete set.emoticons[i].usage_count;
      const e = set.emoticons[i];
      for (const u in e.urls) {
        result.push({
          url: 'https:' + e.urls[u],
          name: e.id + '-' + u,
          ext: 'png',
        });
      }
    }
  }

  const writeOut = await diffSave(
    context.out,
    'ffz',
    JSON.stringify(data, null, ' ')
  );

  if (writeOut) {
    return result;
  }

  return [];
}
