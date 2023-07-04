import { webui2Darwin, webui2Linux, webui2Windows } from "../deps.ts";
import { b64ToBuffer, writeLib } from "./utils.ts";
export function loadLib(libPath?: string) {
  // Determine the library name based
  // on the current operating system
  const libName = (() => {
    switch (Deno.build.os) {
      case "windows":
        return "webui-2-x64.dll";
      case "darwin":
        return "webui-2-x64.dyn";
      default:
        return "webui-2-x64.so";
    }
  })();

  const libBuffer = (() => {
    if (libPath === undefined) {
      switch (Deno.build.os) {
        case "windows":
          return b64ToBuffer(webui2Windows.b64);
        case "darwin":
          return b64ToBuffer(webui2Darwin.b64);
        default:
          return b64ToBuffer(webui2Linux.b64);
      }
    }
    return new Uint8Array();
  })();

  // Use user defined lib or cached one
  const libFullPath = libPath ?? writeLib(libName, libBuffer);

  return Deno.dlopen(
    libFullPath,
    {
      webui_wait: {
        // void webui_wait(void)
        parameters: [],
        result: "void",
        nonblocking: true,
      },
      webui_interface_is_app_running: {
        // bool webui_interface_is_app_running(void)
        parameters: [],
        result: "i32",
      },
      webui_new_window: {
        // size_t webui_new_window(void)
        parameters: [],
        result: "usize",
      },
      webui_show: {
        // bool webui_show(size_t window, const char* content)
        parameters: ["usize", "buffer"],
        result: "i32",
      },
      webui_show_browser: {
        // bool webui_show_browser(size_t window, const char* content, unsigned int browser)
        parameters: ["usize", "buffer", "u32"],
        result: "i32",
      },
      webui_interface_bind: {
        // unsigned int webui_interface_bind(size_t window, const char* element, void (*func)(size_t, unsigned int, char*, char*, unsigned int))
        parameters: ["usize", "buffer", "function"],
        result: "u32",
      },
      webui_script: {
        // bool webui_script(size_t window, const char* script, unsigned int timeout, char* buffer, size_t buffer_length)
        parameters: ["usize", "buffer", "u32", "buffer", "i32"],
        result: "i32",
      },
      webui_run: {
        // bool webui_run(size_t window, const char* script)
        parameters: ["usize", "buffer"],
        result: "i32",
      },
      webui_interface_set_response: {
        // void webui_interface_set_response(size_t window, unsigned int event_number, const char* response)
        parameters: ["usize", "u32", "buffer"],
        result: "void",
      },
      webui_exit: {
        // void webui_exit(void)
        parameters: [],
        result: "void",
      },
      webui_is_shown: {
        //bool webui_is_shown(size_t window)
        parameters: ["usize"],
        result: "bool",
      },
      webui_close: {
        //void webui_close(size_t window)
        parameters: ["usize"],
        result: "void",
      },
      webui_set_multi_access: {
        //void webui_set_multi_access(size_t window, bool status)
        parameters: ["usize", "bool"],
        result: "void",
      },
    } as const,
  );
}
