// FFI (Foreign Function Interface) for webui.ts

import {
  webuiLinuxClangX64,
  webuiLinuxGccAarch64,
  webuiLinuxGccArm,
  webuiLinuxGccX64,
  webuiMacosClangArm64,
  webuiMacosClangX64,
  webuiWindowsGccX64,
  webuiWindowsMsvcX64,
} from "../deps.ts";
import { b64ToBuffer, writeLib } from "./utils.ts";
export function loadLib(
  { libPath, clearCache }: { libPath?: string; clearCache: boolean },
) {
  // Determine the library name based
  // on the current operating system
  const libName = (() => {
    let fileName = "";
    switch (Deno.build.os) {
      case "windows":
        switch (Deno.build.arch) {
          case "x86_64":
            fileName = "webui-windows-msvc-x64/webui-2.dll";
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
          // case "arm64":
          //   fileName = "webui-macos-clang-arm64/webui-2.dylib";
          //   break;
          case "aarch64":
            fileName = "webui-macos-clang-arm64/webui-2.dylib";
            break;
          default:
            throw new Error(
              `Unsupported architecture ${Deno.build.arch} for Darwin`,
            );
        }
        break;
      default:
        // Assuming Linux for default
        switch (Deno.build.arch) {
          case "x86_64":
            fileName = "webui-linux-gcc-x64/webui-2.so";
            break;
          // case "arm":
          //   fileName = "webui-linux-gcc-arm/webui-2.so";
          //   break;
          case "aarch64":
            fileName = "webui-linux-gcc-aarch64/webui-2.so";
            break;
          default:
            throw new Error(
              `Unsupported architecture ${Deno.build.arch} for Linux`,
            );
        }
        break;
    }
    return fileName;
  })();

  const libBuffer = (() => {
    if (libPath === undefined) {
      switch (Deno.build.os) {
        case "windows":
          switch (Deno.build.arch) {
            case "x86_64":
              return b64ToBuffer(webuiWindowsMsvcX64.b64);
            default:
              throw new Error(
                `Unsupported architecture ${Deno.build.arch} for Windows`,
              );
          }
        case "darwin":
          switch (Deno.build.arch) {
            case "x86_64":
              return b64ToBuffer(webuiMacosClangX64.b64);
            case "aarch64":
              return b64ToBuffer(webuiMacosClangArm64.b64);
            // case "arm64":
            //   return b64ToBuffer(webuiMacosClangArm64.b64);
            default:
              throw new Error(
                `Unsupported architecture ${Deno.build.arch} for Darwin`,
              );
          }
        default:
          // Assuming Linux for default
          switch (Deno.build.arch) {
            case "x86_64":
              return b64ToBuffer(webuiLinuxGccX64.b64);
            // case "arm":
            //   return b64ToBuffer(webuiLinuxGccArm.b64);
            case "aarch64":
              return b64ToBuffer(webuiLinuxGccArm.b64);
            default:
              throw new Error(
                `Unsupported architecture ${Deno.build.arch} for Linux`,
              );
          }
      }
    }
    return new Uint8Array();
  })();

  // Use user defined lib or cached one
  const libFullPath = libPath ?? writeLib(libName, libBuffer, clearCache);

  return Deno.dlopen(
    libFullPath,
    {
      webui_wait: {
        // void webui_wait(void)
        parameters: [],
        result: "void",
        nonblocking: true,
      },
      webui_new_window: {
        // size_t webui_new_window(void)
        parameters: [],
        result: "usize",
      },
      webui_show: {
        // bool webui_show(size_t window, const char* content)
        parameters: ["usize", "buffer"],
        result: "bool",
      },
      webui_show_browser: {
        // bool webui_show_browser(size_t window, const char* content, size_t browser)
        parameters: ["usize", "buffer", "usize"],
        result: "bool",
      },
      webui_interface_bind: {
        // size_t webui_interface_bind(size_t window, const char* element, void (*func)(size_t, size_t, char*, char*, size_t, size_t))
        parameters: ["usize", "buffer", "function"],
        result: "usize",
      },
      webui_script: {
        // bool webui_script(size_t window, const char* script, size_t timeout, char* buffer, size_t buffer_length)
        parameters: ["usize", "buffer", "usize", "buffer", "usize"],
        result: "bool",
      },
      webui_run: {
        // void webui_run(size_t window, const char* script)
        parameters: ["usize", "buffer"],
        result: "void",
      },
      webui_interface_set_response: {
        // void webui_interface_set_response(size_t window, size_t event_number, const char* response)
        parameters: ["usize", "usize", "buffer"],
        result: "void",
      },
      webui_exit: {
        // void webui_exit(void)
        parameters: [],
        result: "void",
      },
      webui_is_shown: {
        // bool webui_is_shown(size_t window)
        parameters: ["usize"],
        result: "bool",
      },
      webui_close: {
        // void webui_close(size_t window)
        parameters: ["usize"],
        result: "void",
      },
      webui_set_multi_access: {
        // void webui_set_multi_access(size_t window, bool status)
        parameters: ["usize", "bool"],
        result: "void",
      },
      webui_set_file_handler: {
        // void webui_set_file_handler(size_t window, const void* (*handler)(const char* filename, int* length))
        parameters: ["usize", "function"],
        result: "void",
      },
      webui_interface_is_app_running: {
        // bool webui_interface_is_app_running(void)
        parameters: [],
        result: "bool",
      },
      webui_set_profile: {
        // void webui_set_profile(size_t window, const char* name, const char* path)
        parameters: ["usize", "buffer", "buffer"],
        result: "void",
      },
    } as const,
  );
}
