import { Emote } from './emote.js';

export interface Emote7tv {
  id: string;
  data: {
    host: {
      url: string;
      files: {
        name: string;
      }[];
    };
  };
}

export interface EmoteSet7tv {
  emotes: Emote7tv[];
}

export function extractEmoteSet(set: EmoteSet7tv): Emote[] {
  const result: Emote[] = [];
  set.emotes.forEach((e) => {
    let url = e.data.host.url;
    if (url[0] === '/') {
      url = 'https:' + url;
    }
    e.data.host.files.forEach((f) => {
      result.push({
        name: e.id + '-' + f.name,
        url: url + '/' + f.name,
        ext: '',
      });
    });
  });
  return result;
}

export function cleanObject(obj: any[]): any {
  obj.forEach((o) => {
    if (o.data.state) {
      delete o.data.state;
    }
    if (o.data.owner) {
      if (o.data.owner.roles) {
        delete o.data.owner.roles;
      }
      if (o.data.owner.style) {
        delete o.data.owner.style;
      }
    }
  });
  return obj;
}
