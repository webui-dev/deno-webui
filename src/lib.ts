import { existsSync } from "https://deno.land/std@0.181.0/fs/mod.ts";

// Check if a file exist
function isFileExist(path: string): boolean {
  // TODO: existsSync() is deprecated
  return existsSync(path);
}

// Get current folder path
function getCurrentModulePath(): string {
  const __dirname = new URL(".", import.meta.url).pathname;
  let directory = String(__dirname);
  if (Deno.build.os === "windows") {
    // Remove '/'
    let buf = directory.substring(1);
    directory = buf;
    // Replace '/' by '\'
    buf = directory.replaceAll("/", osSep);
    directory = buf;
  }
  return directory;
}

// Determine the library name based
// on the current operating system
let libName: string;
let osSep: string;
if (Deno.build.os === "windows") {
  libName = "webui-2-x64.dll";
  osSep = "\\";
} else if (Deno.build.os === "linux") {
  libName = "webui-2-x64.so";
  osSep = "/";
} else {
  libName = "webui-2-x64.dyn";
  osSep = "/";
}

export function loadLib(libPath?: string) {
  // Check if the library file exist
  if (!isFileExist(libPath ?? `./${libName}`)) {
    const libPathCwd = getCurrentModulePath() + libName;
    if (!isFileExist(libPathCwd)) {
      console.log(
        "WebUI Error: File not found (" +
          libPath +
          ") or (" +
          libPathCwd +
          ")",
      );
      Deno.exit(1);
    }
    libPath = libPathCwd;
  }

  return Deno.dlopen(
    libPath!,
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