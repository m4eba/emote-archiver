import fetch from 'node-fetch';
import { Emote } from './emote.js';
import { Context, diffSave } from './utils.js';
import { cleanObject, extractEmoteSet } from './7tvcommon.js';

export default async function seventv(context: Context): Promise<Emote[]> {
  try {
    const resp = await fetch(`https://7tv.io/v3/users/twitch/${context.id}`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = (await resp.json()) as any;
    const result: Array<Emote> = extractEmoteSet(data.emote_set);
    const writeOut = await diffSave(
      context.out,
      '7tv',
      JSON.stringify(cleanObject(data.emote_set.emotes), null, ' ')
    );
    if (writeOut) {
      return result;
    }
  } catch (e: any) {
    console.log('unable to get emotes', e);
  }
  return [];
}
