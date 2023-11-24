// Deno WebUI
// Utilities

import * as path from "https://deno.land/std/path/mod.ts";
import { ensureDir, move } from "https://deno.land/std/fs/mod.ts";
import { BlobReader, BlobWriter, ZipReader } from "https://deno.land/x/zipjs/index.js";

// Get current module full folder path
export const currentModulePath = (() => {
  const __dirname = new URL('.', import.meta.url).pathname;
  let directory = String(__dirname);
  if (Deno.build.os === 'windows') {
    if (directory.startsWith('/')) {
      // Remove first '/'
      directory = directory.slice(1);
    }
  }
  return directory;
})();

// Check if a file exist
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

// Download a file from Internet
async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  const fileData = new Uint8Array(await res.arrayBuffer());
  await Deno.writeFile(dest, fileData);
}

// Uncompress a .Zip archive
async function unzipFile(zipFilePath: string, outputDir: string) {
  const zipFileData = await Deno.readFile(zipFilePath);
  const zipFileReader = new BlobReader(new Blob([zipFileData]));
  const zipReader = new ZipReader(zipFileReader);
  const entries = await zipReader.getEntries();
  for (const entry of entries) {
    const fullPath = path.join(outputDir, entry.filename);
    if (entry.directory) {
      await ensureDir(fullPath);
    } else {
      const entryWriter = new BlobWriter();
      const entryData = await entry.getData(entryWriter);
      await Deno.writeFile(fullPath, new Uint8Array(await entryData.arrayBuffer()));
    }
  }
  await zipReader.close();
}

export async function downloadCoreLibrary() {
  // Base URL
  const baseUrl = "https://github.com/webui-dev/webui/releases/download/nightly/";
  // Detect OS
  let os, cc, ext, arch;
  switch (Deno.build.os) {
      case "darwin":
          os = "macos";
          cc = "clang";
          ext = "dylib";
          break;
      case "windows":
          os = "windows";
          cc = "msvc";
          ext = "dll";
          break;
      default:
          os = "linux";
          cc = "gcc";
          ext = "so";
          break;
  }
  // Detect Architecture
  const archMap = {
      "x86": "x86",
      "x86_64": "x64",
      "arm": "arm",
      "aarch64": "arm64",
      "arm64": "arm64"
  };
  arch = archMap[Deno.build.arch];
  if (!arch) {
      console.error(`Error: Unsupported architecture '${Deno.build.arch}'`);
      return;
  }

  // Construct file name and download URL
  const cacheDir = path.join(currentModulePath, `cache`);
  const fileName = `webui-${os}-${cc}-${arch}`;
  const fileUrl = `${baseUrl}${fileName}.zip`;
  const outputDir = path.join(currentModulePath, fileName);

  // Create cache directory
  await ensureDir(cacheDir);

  // Download the archive
  const zipPath = path.join(cacheDir, `${fileName}.zip`);
  await downloadFile(fileUrl, zipPath);

  // Extract the archive
  await unzipFile(zipPath, cacheDir);

  // Copy library
  const libFile = `webui-2.${ext}`;
  await ensureDir(outputDir);
  await Deno.copyFile(path.join(cacheDir, fileName, libFile), path.join(outputDir, libFile), { overwrite: true });

  // Remove cache directory
  await Deno.remove(cacheDir, { recursive: true });
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
