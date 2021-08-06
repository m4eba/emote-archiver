import fetch from 'node-fetch';
import { Emote } from './emote';
import { Context, diffSave } from './utils';

export default async function twitch(context: Context): Promise<Emote[]> {
  const resp = await fetch(
    `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${context.id}`,
    {
      headers: {
        Authorization: `Bearer ${context.token}`,
        'Client-ID': context.clientId,
      },
    }
  );
  const data = await resp.json();

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
    'twitch',
    JSON.stringify(data, null, ' ')
  );
  if (writeOut) {
    return result;
  }

  return [];
}
