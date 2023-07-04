import { exists, osPaths, path } from "../deps.ts";

export function b64ToBuffer(b64: string): Uint8Array {
  const byteArray = atob(b64).split("").map((c) => c.codePointAt(0) ?? 0);
  return new Uint8Array(byteArray);
}

// Get current folder path
export function getCurrentModulePath(libPath: string): string {
  const fsPath = path.fromFileUrl(import.meta.url);
  const { dir } = path.parse(fsPath);
  return path.join(dir, libPath);
}

export async function writeLib(
  libName: string,
  libBuffer: Uint8Array,
): Promise<string> {
  const libPath = path.join(osPaths.temp(), libName);
  if (!await exists(libPath)) {
    await Deno.writeFile(libPath, libBuffer);
  }
  if (!await exists(libPath)) {
    throw new Error(`WebUI: Can't write ${libName} at ${libPath}`);
  }
  return libPath;
}

// Convert String to C-String
export function stringToUint8array(value: string): Uint8Array {
  return new TextEncoder().encode(value + "\0");
}

// Convert C-String to String

export function uint8arrayToString(value: ArrayBuffer): string {
  return new TextDecoder().decode(value);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
