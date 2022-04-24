import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import ffz from './ffz';
import { downloadEmote, Emote } from './emote';
import { Context, fileExists } from './utils';
import bettertv from './bettertv';
import twitchglobal from './twitchglobal';
import twitch from './twitch';
import bettertvglobal from './bettertvglobal';
import seventvglobal from './7tvglobal';
import seventv from './7tv';

if (process.argv.length !== 3) {
  console.log('usage node build/dump.js <folder>');
  process.exit(1);
}
const out = process.argv[2];

if (process.env['TWITCH_CLIENT_ID'] == undefined) {
  console.log('missing env variable TWITCH_CLIENT_ID');
  process.exit(1);
}
if (process.env['TWITCH_CLIENT_SECRET'] == undefined) {
  console.log('missing env variable TWITCH_CLIENT_SECRET');
  process.exit(1);
}

const CLIENT_ID = process.env['TWITCH_CLIENT_ID'];
const CLIENT_SECRET = process.env['TWITCH_CLIENT_SECRET'];

let token = '';

async function getToken(): Promise<string> {
  const resp = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials&scope=user:read:email`,
    {
      method: 'POST',
    }
  );
  const data = await resp.json();
  return data.access_token;
}

async function getEmotes(
  fn: (context: Context) => Promise<Array<Emote>>,
  out: string,
  context: Context,
  postfix: string
) {
  context.out = path.join(out, context.name);
  const emotes = await fn(context);
  for (let i = 0; i < emotes.length; ++i) {
    try {
      await downloadEmote(path.join(out, postfix), emotes[i]);
    } catch (e) {
      console.log(e);
      console.log('unable to download emote', emotes[i].name);
    }
  }
}

async function emotes(name: string) {
  // make dir if not existing
  const emoteOut = path.join(out, name);
  try {
    const stat = await fs.promises.stat(emoteOut);
    if (!stat.isDirectory()) {
      console.log('output is not a directory');
      process.exit(1);
    }
  } catch (e) {
    await fs.promises.mkdir(emoteOut);
  }

  let id = null;
  const idPath = path.join(emoteOut, 'id.txt');
  try {
    await fs.promises.stat(idPath);
    id = (await fs.promises.readFile(idPath, { encoding: 'utf8' })).trim();
  } catch (e) {
    // do nothing, id cache file doesn't exist
  }

  if (id == null) {
    try {
      const resp = await fetch(
        `https://api.twitch.tv/helix/users?login=${name}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Client-ID': CLIENT_ID,
          },
        }
      );
      const data = await resp.json();
      id = data.data[0].id;
      await fs.promises.writeFile(idPath, id);
    } catch (e) {
      console.log(e);
      console.log(`unable to get id for ${name}`);
      return;
    }
  }

  const context: Context = {
    out,
    name,
    id,
    clientId: CLIENT_ID,
    token,
  };
  await getEmotes(ffz, out, context, 'ffz');
  await getEmotes(bettertv, out, context, 'bettertv');
  await getEmotes(twitch, out, context, 'twitch');
  await getEmotes(seventv, out, context, '7tv');
}

(async () => {
  await fs.promises.mkdir(path.join(out, 'ffz'), { recursive: true });
  await fs.promises.mkdir(path.join(out, 'bettertv'), { recursive: true });
  await fs.promises.mkdir(path.join(out, 'twitch'), { recursive: true });
  await fs.promises.mkdir(path.join(out, '7tv'), { recursive: true });
  await fs.promises.mkdir(path.join(out, 'global'), { recursive: true });

  token = await getToken();
  console.log('token', token);

  const context: Context = {
    out,
    name: 'global',
    id: '',
    clientId: CLIENT_ID,
    token,
  };
  await getEmotes(twitchglobal, out, context, 'twitch');
  await getEmotes(bettertvglobal, out, context, 'bettertv');
  await getEmotes(seventvglobal, out, context, '7tv');

  const channelFile = path.join(out, 'channels.txt');
  if (!(await fileExists(channelFile))) {
    console.log('channel.txt not found');
    process.exit(1);
  }
  const data = await fs.promises.readFile(channelFile, {
    encoding: 'utf8',
  });

  const channels = data.split('\n');

  for (let i = 0; i < channels.length; ++i) {
    const name = channels[i];
    if (name.length == 0) continue;
    console.log('processing', name);
    await emotes(name);
  }
})();
