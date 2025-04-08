// Deno WebUI
// Resolves the path to the required native WebUI library,
// ensuring it is downloaded to a central cache if needed.

import { ensureWebUiLib, useNightly } from "./src/utils.ts";

// Determine the base library filename based
// on the current operating system and architecture.
function getBaseLibName(): string {
  let baseName: string;
  switch (Deno.build.os) {
    case "windows":
      baseName = "webui-2.dll";
      // Validate architecture for Windows
      if (Deno.build.arch !== "x86_64" && Deno.build.arch !== "aarch64") {
        throw new Error(
          `Unsupported architecture ${Deno.build.arch} for Windows`,
        );
      }
      break;
    case "darwin": // macOS
      baseName = "libwebui-2.dylib";
      // Validate architecture for macOS
      if (Deno.build.arch !== "x86_64" && Deno.build.arch !== "aarch64") {
        throw new Error(
          `Unsupported architecture ${Deno.build.arch} for macOS`,
        );
      }
      break;
    default: // Linux and other Unix-like OSes
      baseName = "libwebui-2.so";
      // Validate architecture for Linux/others
      if (Deno.build.arch !== "x86_64" && Deno.build.arch !== "aarch64") {
        throw new Error(
          `Unsupported architecture ${Deno.build.arch} for ${Deno.build.os}`,
        );
      }
      break;
  }
  return baseName;
}

// Determine the required base filename
const baseLibName = getBaseLibName();

// Ensure the library exists in the cache (downloads if needed)
// and export the resolved path.
// This promise resolves to the final path of the library file.
export const libPath = await ensureWebUiLib(baseLibName);

// Optional: Export the base name too if needed elsewhere
export { baseLibName };
