// Deno WebUI
// Utilities
import { UntarStream } from "jsr:@std/tar@0.1.6/untar-stream";
import { dirname, normalize } from "jsr:@std/path@1.0.8";
import { BlobReader, ZipReader, BlobWriter } from "jsr:@zip-js/zip-js@2.7.60";
// The WebUI core version to download
export const WebUICoreVersion = '2.5.0-beta.3';

// Combine paths
function joinPath(...segments: string[]): string {
  const isWindows = Deno.build.os === "windows";
  const separator = isWindows ? "\\" : "/";
  const joinedPath = segments
    // Join all segments with the OS-specific separator
    .join(separator)
    // Replace multiple separators with a single one
    .replace(/[\/\\]+/g, separator);
  return joinedPath;
}

// Download a file from Internet
async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  const fileData = new Uint8Array(await res.arrayBuffer());
  await Deno.writeFile(dest, fileData);
}

// Create a directory
async function createDirectory(dirPath: string): Promise<void> {
  await Deno.mkdir(dirPath,{recursive:true})
}

// Copy file and overwrite
async function copyFileOverwrite(srcPath: string, destPath: string) {
  try {
    await Deno.remove(destPath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }
  await Deno.copyFile(srcPath, destPath);
}

// Get current module full folder path
export const currentModulePath = (() => {
  const __dirname = new URL(import.meta.url).pathname;
  let directory = String(__dirname);
  const isWindows = (Deno.build.os === 'windows');
  if (isWindows) {
    if (directory.startsWith('/')) {
      // Remove first '/'
      directory = directory.slice(1);
    }
    // Replace all forward slashes with
    // backslashes for Windows paths
    directory = directory.replaceAll('/', '\\');
  }
  // Get absolute path without the script name
  const pathSeparator = isWindows ? '\\' : '/';
  const lastIndex = directory.lastIndexOf(pathSeparator);
  directory = directory.substring(0, lastIndex + 1);
  // Check if empty
  if (directory === "") {
    return "." + pathSeparator;
  }
  // Check if `X` module folder
  if (directory.startsWith("/x/")) {
    return "." + pathSeparator + directory.slice(1).replace(/\//g, pathSeparator);
  }
  // Other paths
  return directory;
})();

// Check if a file exist
export async function fileExists(filePath: string) {
  try {
    await Deno.stat(filePath);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error;
    }
  }
}

export async function downloadCoreLibrary() {
  // Base URL
  // const baseUrl = `https://github.com/webui-dev/webui/releases/download/${WebUICoreVersion}/`;
  const baseUrl = `https://github.com/webui-dev/webui/releases/download/nightly/`;
  // Detect OS
  let os, cc, ext, libFile;
  switch (Deno.build.os) {
      case "darwin":
          os = "macos";
          cc = "clang";
          ext = "dylib";
          libFile = `libwebui-2.${ext}`;
          break;
      case "windows":
          os = "windows";
          cc = "msvc";
          ext = "dll";
          libFile = `webui-2.${ext}`;
          break;
      default:
          os = "linux";
          cc = "gcc";
          ext = "so";
          libFile = `libwebui-2.${ext}`;
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
  const arch = archMap[Deno.build.arch];
  if (!arch) {
      console.error(`Error: Unsupported architecture '${Deno.build.arch}'`);
      return;
  }

  // Construct file name and download URL
  const cacheDir = joinPath(currentModulePath, `cache`);
  const fileName = `webui-${os}-${cc}-${arch}`;
  const fileUrl = `${baseUrl}${fileName}.zip`;
  const outputDir = joinPath(currentModulePath, fileName);

  // Create cache directory
  await createDirectory(cacheDir);

  // Download the archive
  const zipPath = joinPath(cacheDir, `${fileName}.zip`);
  await downloadFile(fileUrl, zipPath);

  // Extract the archive
  const zipBlob = await Deno.readFile(zipPath).then(data => new Blob([data]));
  const zipReader = new ZipReader(new BlobReader(zipBlob));
  const entries = await zipReader.getEntries();
  for (const entry of entries) {
    const filePath = `${cacheDir}/${entry.filename}`;
    // Create directories if needed
    if (entry.directory) {
      await Deno.mkdir(filePath, { recursive: true });
    } else {
      // Make sure parent directory exists
      const parentDir = dirname(filePath)
      await Deno.mkdir(parentDir, { recursive: true });
      // Extract file
      const writer = new BlobWriter();
      const data = await entry.getData!(writer);
      await Deno.writeFile(filePath, new Uint8Array(await data.arrayBuffer()));
    }
  }
  await zipReader.close()

  // Copy library
  await createDirectory(outputDir);
  await copyFileOverwrite(joinPath(cacheDir, fileName, libFile), joinPath(outputDir, libFile));

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
