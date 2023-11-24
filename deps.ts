// Deno WebUI
// Dependences needed by webui.ts

import { 
  fileExists,
  downloadCoreLibrary,
  currentModulePath
} from "./src/utils.ts";

// Determine the library name based
// on the current operating system
async function getLibName() {
  let fileName = "";
  switch (Deno.build.os) {
    case "windows":
      switch (Deno.build.arch) {
        case "x86_64":
          fileName = "webui-windows-msvc-x64/webui-2.dll";
          break;
        // case "arm":
        //   fileName = "webui-windows-msvc-arm/webui-2.dll";
        //   break;
        // case "arm64":
        case "aarch64":
          fileName = "webui-windows-msvc-arm64/webui-2.dll";
          break;
        default:
          throw new Error(
            `Unsupported architecture ${Deno.build.arch} for Windows`,
          );
      }
      break;
    case "darwin":
      switch (Deno.build.arch) {
        case "x86_64":
          fileName = "webui-macos-clang-x64/webui-2.dylib";
          break;
        // case "arm":
        //   fileName = "webui-macos-clang-arm/webui-2.dylib";
        //   break;
        // case "arm64":
        case "aarch64":
          fileName = "webui-macos-clang-arm64/webui-2.dylib";
          break;
        default:
          throw new Error(
            `Unsupported architecture ${Deno.build.arch} for macOS`,
          );
      }
      break;
    default:
      // Linux
      // freebsd
      // netbsd
      // aix
      // solaris
      // illumos
      switch (Deno.build.arch) {
        case "x86_64":
          fileName = "webui-linux-gcc-x64/webui-2.so";
          break;
        // case "arm":
        //   fileName = "webui-linux-gcc-arm/webui-2.so";
        //   break;
        // case "arm64":
        case "aarch64":
          fileName = "webui-linux-gcc-arm64/webui-2.so";
          break;
        default:
          throw new Error(
            `Unsupported architecture ${Deno.build.arch} for ${Deno.build.os}`,
          );
      }
      break;
  }
  // Get the current module full path
  const srcFullPath = currentModulePath;
  const FullPath = srcFullPath + fileName;
  // Check if WebUI library exist
  const exists = await fileExists(FullPath);
  if (!exists) {
    // Download the WebUI library
    await downloadCoreLibrary();
  }
  return FullPath;
}

export const libName = await getLibName();
