// Deno WebUI
// Utilities
import { dirname, join } from "jsr:@std/path@1.0.8";
import { exists } from "jsr:@std/fs@0.229.3/exists";
import { BlobReader, BlobWriter, ZipReader } from "jsr:@zip-js/zip-js@2.7.60";

// The WebUI core version to download (Consider using this if not using nightly)
export const WebUICoreVersion = "2.5.0-beta.3";
export const useNightly = true; // Set to false to use WebUICoreVersion

// --- Cache Directory Logic ---

/**
 * Gets the appropriate cache directory for the current platform.
 * Creates the directory if it doesn't exist.
 * @returns {Promise<string>} The path to the cache directory.
 */
async function getCacheDir(): Promise<string> {
  let baseCacheDir: string | undefined;

  switch (Deno.build.os) {
    case "windows": {
      baseCacheDir = Deno.env.get("LOCALAPPDATA");
      break;
    }
    case "darwin": {
      const home = Deno.env.get("HOME");
      if (home) {
        baseCacheDir = join(home, "Library", "Caches");
      }
      break;
    }
    default: // Linux, FreeBSD, etc.
      baseCacheDir = Deno.env.get("XDG_CACHE_HOME");
      if (!baseCacheDir) {
        const home = Deno.env.get("HOME");
        if (home) {
          baseCacheDir = join(home, ".cache");
        }
      }
      break;
  }

  if (!baseCacheDir) {
    // Fallback to a temporary directory if no standard cache is found
    console.warn(
      "Could not determine standard cache directory. Using Deno temporary directory.",
    );
    // Note: Deno's temp dir might be cleaned up unexpectedly.
    // Consider creating a '.deno_webui_cache' in the user's home as a better fallback.
    baseCacheDir = await Deno.makeTempDir({ prefix: "deno_webui_cache_" });
    // Or: const home = Deno.env.get("HOME"); baseCacheDir = home ? join(home, '.deno_webui_cache') : await Deno.makeTempDir(...);
  }

  const webuiCacheDir = join(baseCacheDir, "deno_webui_libs");

  // Ensure the directory exists
  await Deno.mkdir(webuiCacheDir, { recursive: true });

  return webuiCacheDir;
}

// --- Download and Extraction Logic ---

/**
 * Downloads and extracts the required WebUI library to the cache directory.
 * @param {string} targetLibPath - The final path where the library should exist in the cache.
 * @param {string} osName - OS identifier (e.g., "windows", "macos", "linux").
 * @param {string} compilerName - Compiler identifier (e.g., "msvc", "clang", "gcc").
 * @param {string} archName - Architecture identifier (e.g., "x64", "arm64").
 * @param {string} libFileNameInZip - The full path of the library *inside* the zip archive.
 * @returns {Promise<void>}
 * @throws {Error} If download or extraction fails.
 */
async function downloadAndExtractLibrary(
  targetLibPath: string,
  osName: string,
  compilerName: string,
  archName: string,
  libFileNameInZip: string,
): Promise<void> {
  const cacheDir = dirname(targetLibPath); // Get the parent cache directory

  // Determine download URL
  const baseUrl = useNightly
    ? `https://github.com/webui-dev/webui/releases/download/nightly/`
    : `https://github.com/webui-dev/webui/releases/download/${WebUICoreVersion}/`; // Use defined version if not nightly

  const zipFileName = `webui-${osName}-${compilerName}-${archName}.zip`;
  const zipUrl = `${baseUrl}${zipFileName}`;
  const tempZipPath = join(cacheDir, `${zipFileName}.download`); // Temporary download path

  console.log(`Downloading WebUI library from ${zipUrl}...`);

  try {
    // Download the archive
    const res = await fetch(zipUrl);
    if (!res.ok) {
      throw new Error(
        `Failed to download ${zipUrl}: ${res.status} ${res.statusText}`,
      );
    }
    const zipData = await res.arrayBuffer();
    await Deno.writeFile(tempZipPath, new Uint8Array(zipData));
    console.log(`Downloaded to ${tempZipPath}`);

    // Extract the specific library file
    console.log(`Extracting ${libFileNameInZip} from ${tempZipPath}...`);
    const zipBlob = new Blob([zipData]);
    const zipReader = new ZipReader(new BlobReader(zipBlob));
    const entries = await zipReader.getEntries();

    let foundEntry = false;
    for (const entry of entries) {
      // Normalize zip entry filename (might contain different slashes)
      const entryPath =  entry.filename.replace(/\\/g, "/");
      const targetEntryPath = libFileNameInZip.replace(/\\/g, "/");

      if (!entry.directory && entryPath === targetEntryPath) {
        console.log(`Found entry: ${entry.filename}`);
        const writer = new BlobWriter();
        const data = await entry.getData!(writer);
        await Deno.writeFile(
          targetLibPath,
          new Uint8Array(await data.arrayBuffer()),
        );
        foundEntry = true;
        console.log(`Extracted library to ${targetLibPath}`);
        break; // Found the file, no need to check others
      }
    }
    await zipReader.close();

    if (!foundEntry) {
      throw new Error(
        `Library file "${libFileNameInZip}" not found inside downloaded archive ${zipFileName}`,
      );
    }
  } catch (error) {
    console.error("WebUI library download/extraction failed:", error);
    // Clean up partial download if it exists
    try {
      await Deno.remove(targetLibPath).catch(() => {}); // Remove potentially incomplete extraction
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        console.error("Cleanup error:", e);
      }
    }
    throw error; // Re-throw the error
  } finally {
    // Clean up the downloaded zip file regardless of success/failure
    try {
      await Deno.remove(tempZipPath);
      console.log(`Removed temporary file ${tempZipPath}`);
    } catch (e) {
      if (!(e instanceof Deno.errors.NotFound)) {
        console.error(`Failed to remove temporary zip file ${tempZipPath}:`, e);
      }
    }
  }
}

/**
 * Ensures the correct WebUI native library exists in the cache, downloading it if necessary.
 * @param {string} baseLibName - The OS-specific library filename (e.g., "webui-2.dll").
 * @returns {Promise<string>} The full path to the cached library file.
 */
export async function ensureWebUiLib(baseLibName: string): Promise<string> {
  const cacheDir = await getCacheDir();
  const targetLibPath = join(cacheDir, baseLibName);

  // 1. Check if the library already exists in the cache
  if (await exists(targetLibPath)) {
    console.log(`Using cached WebUI library: ${targetLibPath}`);
    return targetLibPath;
  }

  // 2. Determine download parameters if not cached
  console.log(`WebUI library not found in cache. Attempting download...`);
  let osName: string;
  let compilerName: string;

  const archMap: { [key: string]: string } = {
    "x86_64": "x64",
    "aarch64": "arm64",
  };
  const archName = archMap[Deno.build.arch];
  if (!archName) {
    throw new Error(
      `Unsupported architecture: ${Deno.build.arch} for ${Deno.build.os}`,
    );
  }

  switch (Deno.build.os) {
    case "windows":
      osName = "windows";
      compilerName = "msvc";
      break;
    case "darwin":
      osName = "macos";
      compilerName = "clang";
      break;
    default: // Linux and others
      osName = "linux";
      compilerName = "gcc";
      break;
  }

  const zipDirName = `webui-${osName}-${compilerName}-${archName}`;
  const libFileNameInZip = `${zipDirName}/${baseLibName}`; // Path inside the zip

  // 3. Download and extract
  await downloadAndExtractLibrary(
    targetLibPath,
    osName,
    compilerName,
    archName,
    libFileNameInZip,
  );

  // 4. Return the path
  return targetLibPath;
}

// --- String Conversions (Keep as they are useful) ---

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
