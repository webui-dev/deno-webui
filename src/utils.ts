// Deno WebUI
// Utilities

// Combine paths
function joinPath(...segments: string[]): string {
  const isWindows = Deno.build.os === "windows";
  const separator = isWindows ? "\\" : "/";
  let joinedPath = segments
    .join(separator) // Join all segments with the OS-specific separator
    .replace(/[\/\\]+/g, separator); // Replace multiple separators with a single one
  return joinedPath;
}

// Download a file from Internet
async function downloadFile(url: string, dest: string) {
  const res = await fetch(url);
  const fileData = new Uint8Array(await res.arrayBuffer());
  await Deno.writeFile(dest, fileData);
}

// Run a system command
async function runCommand(command: string[]): Promise<void> {
  const process = Deno.run({
      cmd: command,
      stdout: "null",
      stderr: "null",
  });
  await process.status();
  process.close();
}

// Create a directory
async function createDirectory(dirPath: string): Promise<void> {
  const isWindows = Deno.build.os === "windows";
  const command = isWindows ? ["cmd", "/c", "mkdir", dirPath] : ["mkdir", "-p", dirPath];
  await runCommand(command);
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
  switch (Deno.build.os) {
    case "windows":
      await runCommand(["tar", "-xf", zipPath, "-C", cacheDir]);
      break;
    default:
      await runCommand(["unzip", "-q", zipPath, "-d", cacheDir]);
      break;
  }

  // Copy library
  const libFile = `webui-2.${ext}`;
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
