import fs from 'fs';
import path from 'path';

export interface Context {
  out: string;
  name: string;
  id: string;
  clientId: string;
  token: string;
}

export async function latest(out: string, postfix: string): Promise<string> {
  // latest year
  let dir = await fs.promises.readdir(out);
  dir = dir.filter((v) => /^\d\d\d\d$/.test(v)).sort();
  if (dir.length == 0) return '';

  let files = await fs.promises.readdir(path.join(out, dir[dir.length - 1]));
  const reg = new RegExp(postfix + '.txt$');
  files = files.filter((v) => reg.test(v)).sort();
  if (files.length == 0) return '';
  console.log('latest file', files[files.length - 1]);
  return path.join(out, dir[dir.length - 1], files[files.length - 1]);
}

export async function fileExists(name: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(name);
    if (stat.isFile()) {
      return true;
    }
  } catch (e) {
    //
  }
  return false;
}

export async function diffSave(
  out: string,
  prefix: string,
  content: string
): Promise<boolean> {
  const time = new Date();

  const latestFile = await latest(out, prefix);
  const outPath = path.join(out, time.getFullYear().toString());
  const outName = time.toISOString().replace(/:/g, '-') + `-${prefix}.txt`;
  await fs.promises.mkdir(outPath, { recursive: true });

  let writeOut = false;
  if (latestFile.length == 0) {
    writeOut = true;
  } else {
    const fileContents = await fs.promises.readFile(latestFile, {
      encoding: 'utf-8',
    });
    if (fileContents !== content) {
      writeOut = true;
    }
  }

  if (writeOut) {
    await fs.promises.writeFile(path.join(outPath, outName), content);
    return true;
  }
  return false;
}
