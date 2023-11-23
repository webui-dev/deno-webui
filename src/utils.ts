// Deno WebUI
// Utilities

export async function fileExists(path) {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
}

export async function runCommand(command) {
  const process = Deno.run({
    cmd: command
  });
  await process.status();
  process.close();
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
 * Convert a C-String to String.
 * @param {Uint8Array} value - an `char* / Uint8Array` that contains a C-String.
 * @returns a string.
 */
export function fromCString(value: Uint8Array): string {
  const end = value.findIndex((byte) => byte === 0x00); //find C-string end
  return new TextDecoder().decode(value.slice(0, end));
}

export class WebUIError extends Error {}
