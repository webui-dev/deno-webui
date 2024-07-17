import * as b64 from "https://deno.land/std@0.91.0/encoding/base64.ts";
import { WebUICoreVersion, createDirectory, currentModulePath, downloadFile, joinPath, runCommand } from "./src/utils.ts";

const baseUrl = `https://github.com/webui-dev/webui/releases/download/${WebUICoreVersion}/`;

const cacheDir = joinPath(currentModulePath, `webui-cache`);
const outputDir = joinPath(currentModulePath, 'webui-libs');

if (import.meta.main) {
  await createDirectory(cacheDir);
  await createDirectory(outputDir);

  const libs = [
    // Filenames for Windows
    "webui-windows-msvc-x64/webui-2.dll",      // Windows x86_64

    // Filenames for macOS
    "webui-macos-clang-x64/webui-2.dylib",     // macOS x86_64
    "webui-macos-clang-arm64/webui-2.dylib",   // macOS aarch64

    // Filenames for Linux and other UNIX-like OS
    "webui-linux-gcc-x64/webui-2.so",          // Linux x86_64
    "webui-linux-gcc-arm64/webui-2.so",        // Linux aarch64
  ];

  for (const it of libs) {
    await downloadCoreLibrary(it);
  }

  await Deno.remove(cacheDir, { recursive: true });
}

async function downloadCoreLibrary(it: string) {
  const [zit, xit] = it.split('/');
  const [, , , izit] = zit.split('-');
  const [, ixit] = xit.split('.');

  const uzit = `${baseUrl}${zit}.zip`;
  const ezit = joinPath(cacheDir, `${zit}.zip`);
  await downloadFile(uzit, ezit);
  console.log(`Download complete: ${ezit}`);

  switch (Deno.build.os) {
    case "windows":
      await runCommand(["tar", "-xf", ezit, "-C", cacheDir]);
      break;
    default:
      await runCommand(["unzip", "-q", ezit, "-d", cacheDir]);
      break;
  }
  console.log(`Extraction complete: ${cacheDir}/${zit}`);

  const zixit = `webui-${izit}.${ixit}`;
  const izixit = joinPath(outputDir, zixit);
  const kizixit = `${izixit}_.json`;

  const kit = joinPath(cacheDir, it);
  const ikit = await Deno.readFile(kit);
  console.log(`Original: ${kit}`);

  const ot = "gzip";
  let kikit = await compress(ikit, ot)
  let ikikit = b64.encode(kikit);

  let et = [
    `{`
    , ` "size": ${ikikit.length},`
  ]

  et.push(` "compression": "${ot}",`)
  et.push(` "encoded": "${ikikit}"`)
  et.push(`}`)
  let tet = et.join("\n")

  await Deno.writeTextFile(kizixit, tet);
  console.log(`Complete: ${kizixit}`);
}

async function compress(data: Uint8Array, compression: string): Promise<Uint8Array> {
  let input = new Blob([data])
  let cs = new CompressionStream(compression)
  let stream = input.stream().pipeThrough(cs)

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
