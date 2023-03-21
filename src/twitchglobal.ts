import fetch from 'node-fetch';
import { Emote } from './emote';
import { Context, diffSave } from './utils';

export default async function twitchglobal(context: Context): Promise<Emote[]> {
  try {
    const resp = await fetch('https://api.twitch.tv/helix/chat/emotes/global', {
      headers: {
        Authorization: `Bearer ${context.token}`,
        'Client-ID': context.clientId,
      },
      signal: AbortSignal.timeout(5000),
    });
    const data = (await resp.json()) as any;

    const result = new Array<Emote>();
    for (let i = 0; i < data.data.length; ++i) {
      const e = data.data[i];
      for (const key in e.images) {
        result.push({
          name: e.id + '-' + key.substr(4, 1),
          url: e.images[key],
          ext: 'png',
        });
      }
    }

    const writeOut = await diffSave(
      context.out,
      'twitchglobal',
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
