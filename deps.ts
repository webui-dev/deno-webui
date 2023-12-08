// Deno WebUI
// Dependences needed by webui.ts

import * as b64 from "https://deno.land/std@0.91.0/encoding/base64.ts";

import {
  fileExists,
  joinPath
} from "./src/utils.ts";

import libs from './dir.ts';

// Determine the library name based
// on the current operating system
async function getLibName() {
  const it = libs[Deno.build.os];
  const xit = `webui-2.${it.ext}`;
  const ixit = joinPath(Deno.env.get('HOME'), '.webui', xit);
  if (!await fileExists(ixit)) {
    const zit = it.encoded[Deno.build.arch];
    const izit = b64.decode(zit);
    const xizit = await decompress(izit, 'gzip');
    await Deno.writeFile(ixit, xizit);
  }
  return ixit;
}

async function decompress(data: Uint8Array, compression: string): Promise<Uint8Array> {
  let input = new Blob([data])
  let ds = new DecompressionStream(compression)
  let stream = input.stream().pipeThrough(ds)

  let outParts: Uint8Array[] = []
  let writer = new WritableStream<Uint8Array>({
    write(chunk) {
      outParts.push(chunk)
    }
  })

  await stream.pipeTo(writer)

  let buf = await new Blob(outParts).arrayBuffer()
  return new Uint8Array(buf)
}

export const libName = await getLibName();
