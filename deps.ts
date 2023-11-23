// Deno WebUI
// Dependences needed by webui.ts

import { 
  fileExists,
  runCommand
} from "./src/utils.ts";

// Get the current module full path
const currentModulePath = (() => {
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
        case "arm":
          fileName = "webui-windows-msvc-arm/webui-2.dll";
          break;
        case "arm64":
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
        case "arm":
          fileName = "webui-macos-clang-arm/webui-2.dylib";
          break;
        case "arm64":
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
      // Assuming Linux for default
      switch (Deno.build.arch) {
        case "x86_64":
          fileName = "webui-linux-gcc-x64/webui-2.so";
          break;
        case "arm":
          fileName = "webui-linux-gcc-arm/webui-2.so";
          break;
        case "arm64":
        case "aarch64":
          fileName = "webui-linux-gcc-arm64/webui-2.so";
          break;
        default:
          throw new Error(
            `Unsupported architecture ${Deno.build.arch} for Linux`,
          );
      }
      break;
  }
  const srcFullPath = currentModulePath + '/src/';
  const FullPath = srcFullPath + fileName;
  const exists = await fileExists(FullPath);
  if (!exists) {
    // Run bootstrap script to download WebUI binaries
    switch (Deno.build.os) {
      case "windows":
        // Windows
        let path = srcFullPath.replace(/\//g, "\\");
        await runCommand(["cmd.exe", "/c", `cd ${path} && bootstrap.bat minimal`]);
        break;
      default:
        // Linux - macOS
        // TODO: Run: cd {srcFullPath} && sh bootstrap.sh minimal
        //
        // await runCommand(["/bin/bash", "-c", `cd ${srcFullPath} && sh bootstrap.sh minimal`]);
    }
  }
  return FullPath;
}

export const libName = await getLibName();
