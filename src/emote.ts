import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import moment from 'moment';
import { fileExists } from './utils.js';

export interface Emote {
  url: string;
  name: string;
  ext: string;
}

export interface MetaFile {
  count: number;
  modified: { [name: string]: string };
}

export function timeoutPipe(
  ins: NodeJS.ReadableStream,
  outs: NodeJS.WritableStream,
  timeout: number
): Promise<number> {
  return new Promise((resolve, reject) => {
    let size = 0;
    function timeoutFailed(): void {
      reject('read timeout');
    }
    let timer = setTimeout(timeoutFailed, timeout);
    ins.on('close', () => {
      clearTimeout(timer);
      outs.end();
      resolve(size);
    });
    ins.on('end', () => {
      clearTimeout(timer);
      outs.end();
      resolve(size);
    });

    ins.on('data', (chunk: Buffer) => {
      size += chunk.length;
      outs.write(chunk);
      clearTimeout(timer);
      timer = setTimeout(timeoutFailed, timeout);
    });
  });
}

export async function downloadEmote(out: string, emote: Emote): Promise<void> {
  console.log('write', emote);
  try {
    const resp = await fetch(emote.url, { signal: AbortSignal.timeout(5000) });
    const modified = resp.headers.get('last-modified');
    if (modified == null) {
      console.log('missing last modified header', emote.name);
      return;
    }
    const mModified = moment(modified);
    const metaFilename = path.join(out, `${emote.name}.json`);
    let data: MetaFile = {
      count: 0,
      modified: {},
    };

    if (await fileExists(metaFilename)) {
      const content = await fs.promises.readFile(metaFilename, {
        encoding: 'utf-8',
      });
      try {
        data = JSON.parse(content) as MetaFile;
        const latest = data.modified[emote.name];
        if (latest == undefined) {
          console.log('modified file corrupt');
          process.exit(1);
        }
        const mlatest = moment(latest);
        if (mlatest.isSameOrAfter(mModified)) {
          return;
        }
        data.modified[`${emote.name}.${data.count}`] = latest;
        await fs.promises.rename(
          path.join(out, `${emote.name}${emote.ext}`),
          path.join(out, `${emote.name}.${data.count}${emote.ext}`)
        );
      } catch (e) {
        console.log(e);
        // unable to parser modified file?
      }
    }

    data.count = data.count + 1;
    data.modified[emote.name] = modified;

    if (!resp.body) throw new Error('no body');
    const bufOut = fs.createWriteStream(
      path.join(out, `${emote.name}${emote.ext}`)
    );
    await timeoutPipe(resp.body, bufOut, 30 * 1000);
    await fs.promises.writeFile(metaFilename, JSON.stringify(data, null, ' '));

    console.log('modified', modified);
  } catch (e: any) {
    console.log('unable to download emote', emote, e);
  }
}
