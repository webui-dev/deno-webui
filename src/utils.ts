import { existsSync } from "https://deno.land/std@0.192.0/fs/exists.ts";
import { fs, path } from "../deps.ts";

/**
 * The function converts a base64 string to a Uint8Array buffer.
 * @param {string} b64 - The parameter `b64` is a string that represents a base64 encoded value.
 * @returns a Uint8Array, which is a typed array representing an array of 8-bit unsigned integers.
 */
export function b64ToBuffer(b64: string): Uint8Array {
  const byteArray = atob(b64).split("").map((c) => c.codePointAt(0) ?? 0);
  return new Uint8Array(byteArray);
}

/**
 * The function `writeLib` writes a library file to a temporary directory and returns the path of the
 * written file.
 * @param {string} libName - The `libName` parameter is a string that represents the name of the
 * library file that will be written.
 * @param {Uint8Array} libBuffer - The `libBuffer` parameter is a `Uint8Array` that represents the
 * binary data of the library file that needs to be written.
 * @param {boolean} clearCache - Force to clear lib cache.
 * @returns lib full path.
 */
export function writeLib(
  libName: string,
  libBuffer: Uint8Array,
  clearCache: boolean,
): string {
  const cachePath = path.join(getHome(), ".deno_webui");
  fs.ensureDirSync(cachePath);
  const libPath = path.join(getHome(), ".deno_webui", libName);
  if (!existsSync(libPath) || clearCache) {
    Deno.writeFileSync(libPath, libBuffer);
  }
  if (!existsSync(libPath)) {
    throw new WebUIError(`Can't write ${libName} at ${libPath}`);
  }
  return libPath;
}

/**
 * Convert a String to C-String.
 * @param {string} value
 * @returns a char[].
 */
export function toCString(value: string): Uint8Array {
  return new TextEncoder().encode(value + "\0");
}

/**
 * Convert C-String to String.
 * @param {Uint8Array} value - an `char* / Uint8Array` that contains a C-String.
 * @returns a string.
 */
export function fromCString(value: Uint8Array): string {
  const end = value.findIndex((byte) => byte === 0x00); //find C-string end
  return new TextDecoder().decode(value.slice(0, end));
}

export class WebUIError extends Error {}

/**
 * Returns the path to the user's home directory, taking into account the
 * operating system.
 * @returns home path
 */
export function getHome(): string {
  if (Deno.build.os === "windows") {
    const home = Deno.env.get("USERPROFILE");
    if (home === undefined) {
      throw new Error(
        "$USERPROFILE is undefined, can't cache files to your home directory",
      );
    }
    return home;
  }
  const home = Deno.env.get("HOME");
  if (home === undefined) {
    throw new Error(
      "$USERPROFILE is undefined, can't cache files to your home directory",
    );
  }
  return home;
}
