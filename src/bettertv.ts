import fetch from 'node-fetch';
import { Emote } from './emote';
import { Context, diffSave } from './utils';

function getEmotes(
  emotes: Array<{ id: string; imageType: string }>
): Array<Emote> {
  const result: Array<Emote> = [];
  for (let i = 0; i < emotes.length; ++i) {
    const e = emotes[i];

    [1, 2, 3].forEach((zoom) => {
      result.push({
        name: e.id + '-' + zoom,
        url: `https://cdn.betterttv.net/emote/${e.id}/${zoom}x`,
        ext: e.imageType,
      });
    });
  }
  return result;
}

export default async function bettertv(context: Context): Promise<Emote[]> {
  const resp = await fetch(
    `https://api.betterttv.net/3/cached/users/twitch/${context.id}`
  );
  const data = await resp.json();
  let result = getEmotes(data.channelEmotes);
  result = result.concat(getEmotes(data.sharedEmotes));

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
