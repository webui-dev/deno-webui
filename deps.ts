// Deno WebUI
// Dependences needed by webui.ts

// Get the current module full path
const currentModulePath = (() => {
  const __dirname = new URL('.', import.meta.url).pathname;
  let directory = String(__dirname);
  if (Deno.build.os === 'windows') {
    // Remove first '/'
    directory = directory.substring(1);
  }
  return directory;
})();

// Determine the library name based
// on the current operating system
export const libName = (() => {
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
  return currentModulePath + '/src/' + fileName;
})();
