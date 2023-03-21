import fetch from 'node-fetch';
import { Emote } from './emote.js';
import { Context, diffSave } from './utils.js';

export default async function bettertvglobal(
  context: Context
): Promise<Emote[]> {
  try {
    const resp = await fetch(
      'https://api.betterttv.net/3/cached/emotes/global',
      { signal: AbortSignal.timeout(5000) }
    );
    const data = (await resp.json()) as any;
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
  } catch (e: any) {
    console.log('unable to get emotes', e);
  }
  return [];
}
