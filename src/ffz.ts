import fetch from 'node-fetch';
import { Context, diffSave } from './utils';
import { Emote } from './emote';

export default async function ffz(context: Context): Promise<Emote[]> {
  try {
    const resp = await fetch(
      `https://api.frankerfacez.com/v1/room/${context.name}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = (await resp.json()) as any;
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
  } catch (e: any) {
    console.log('unable to get emote', e);
  }

  return [];
}
