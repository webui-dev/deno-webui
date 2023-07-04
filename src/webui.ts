/*
  WebUI Library 2.3.0

  http://webui.me
  https://github.com/webui-dev/deno-webui

  Copyright (c) 2020-2023 Hassan Draga.
  Licensed under MIT License.
  All rights reserved.
  Canada.
*/

import { existsSync } from "https://deno.land/std@0.181.0/fs/mod.ts";

export const version = "2.3.0";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const browser = {
  AnyBrowser: 0, // 0. Default recommended web browser
  Chrome: 1, // 1. Google Chrome
  Firefox: 2, // 2. Mozilla Firefox
  Edge: 3, // 3. Microsoft Edge
  Safari: 4, // 4. Apple Safari
  Chromium: 5, // 5. The Chromium Project
  Opera: 6, // 6. Opera Browser
  Brave: 7, // 7. The Brave Browser
  Vivaldi: 8, // 8. The Vivaldi Browser
  Epic: 9, // 9. The Epic Browser
  Yandex: 10, // 10. The Yandex Browser
};

type Usize = number | bigint;
type BindCallback<T extends string | number | boolean | undefined | void> = (
  event: event,
) => T;

export interface event {
  win: Usize;
  event_type: number;
  element: string;
  data: string;
}

export const js = {
  timeout: 0,
  BufferSize: 1024 * 8,
  response: "",
};

interface Js {
  timeout: number;
  BufferSize: number;
  response: string;
}

// Determine the library name based
// on the current operating system
let lib_name: string;
let os_sep: string;
if (Deno.build.os === "windows") {
  lib_name = "webui-2-x64.dll";
  os_sep = "\\";
} else if (Deno.build.os === "linux") {
  lib_name = "webui-2-x64.so";
  os_sep = "/";
} else {
  lib_name = "webui-2-x64.dyn";
  os_sep = "/";
}

// Full path to the library name
let lib_path = "./" + lib_name;

// Check if a file exist
function is_file_exist(path: string): boolean {
  // TODO: existsSync() is deprecated
  return existsSync(path);
}

// Convert String to C-String
function string_to_uint8array(value: string): Uint8Array {
  return encoder.encode(value + "\0");
}

// Get current folder path
function get_current_module_path(): string {
  const __dirname = new URL(".", import.meta.url).pathname;
  let directory = String(__dirname);
  if (Deno.build.os === "windows") {
    // Remove '/'
    let buf = directory.substring(1);
    directory = buf;
    // Replace '/' by '\'
    buf = directory.replaceAll("/", os_sep);
    directory = buf;
  }
  return directory;
}

// Convert C-String to String
function uint8array_to_string(value: ArrayBuffer): string {
  return decoder.decode(value);
}

// Load the library

// Check if the library file exist
if (!is_file_exist(lib_path)) {
  const lib_path_cwd = get_current_module_path() + lib_name;
  if (!is_file_exist(lib_path_cwd)) {
    console.log(
      "WebUI Error: File not found (" +
        lib_path +
        ") or (" +
        lib_path_cwd +
        ")",
    );
    Deno.exit(1);
  }
  lib_path = lib_path_cwd;
}

// Load the library
// FFI
const webui_lib = Deno.dlopen(
  lib_path,
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

export function set_lib_path(path: string) {
  lib_path = path;
}

export function new_window(): Usize {
  return webui_lib.symbols.webui_new_window();
}

export function show(win: Usize, content: string): number {
  return webui_lib.symbols.webui_show(win, string_to_uint8array(content));
}

export function show_browser(
  win: Usize,
  content: string,
  browser: number,
): number {
  return webui_lib.symbols.webui_show_browser(
    win,
    string_to_uint8array(content),
    browser,
  );
}

export function webui_is_shown(win: Usize) {
  return webui_lib.symbols.webui_is_shown(win);
}
export function webui_close(win: Usize) {
  return webui_lib.symbols.webui_close(win);
}
export function webui_set_multi_access(win: Usize, status: boolean) {
  return webui_lib.symbols.webui_set_multi_access(win, status);
}

export function exit() {
  webui_lib.symbols.webui_exit();
}

export function script(win: Usize, js: Js, script: string): boolean {
  // Response Buffer
  const size: number = js.BufferSize > 0 ? js.BufferSize : 1024 * 8;
  const buffer = new Uint8Array(size);

  // Execute the script
  const status = webui_lib.symbols.webui_script(
    win,
    string_to_uint8array(script),
    js.timeout,
    buffer,
    size,
  );

  // Update
  js.response = String(uint8array_to_string(buffer));

  return Boolean(status);
}

export function run(win: Usize, script: string): boolean {
  // Execute the script
  const status = webui_lib.symbols.webui_run(
    win,
    string_to_uint8array(script),
  );

  return Boolean(status);
}

export function bind<T extends string | number | boolean | undefined | void>(
  win: Usize,
  element: string,
  func: BindCallback<T>,
) {
  const callbackResource = new Deno.UnsafeCallback(
    {
      // unsigned int webui_interface_bind(..., void (*func)(size_t, unsigned int, char*, char*, unsigned int))
      parameters: ["usize", "u32", "pointer", "pointer", "u32"],
      result: "void",
    } as const,
    (
      param_window: Usize,
      param_event_type: number,
      param_element: Deno.PointerValue,
      param_data: Deno.PointerValue,
      param_event_number: number,
    ) => {
      // Create elements
      const win = param_window;
      const event_type = Math.trunc(param_event_type);
      const element = param_element != null
        ? new Deno.UnsafePointerView(param_element).getCString()
        : "";
      const data = param_data != null
        ? new Deno.UnsafePointerView(param_data).getCString()
        : "";
      const event_number = Math.trunc(param_event_number);

      // Create struct
      const e: event = {
        win: win,
        event_type: event_type,
        element: element,
        data: data,
      };

      // Call the user callback
      const result = String(func(e));

      // Send back the response
      webui_lib.symbols.webui_interface_set_response(
        win,
        event_number,
        string_to_uint8array(result),
      );
    },
  );

  webui_lib.symbols.webui_interface_bind(
    win,
    string_to_uint8array(element),
    callbackResource.pointer,
  );
}

// TODO: We should use the Non-blocking FFI to call
// `webui_lib.symbols.webui_wait()`. but it breaks
// the Deno script main thread. Lets do it in another way for now.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function wait() {
  while (true) {
    await sleep(10);
    if (!webui_lib.symbols.webui_interface_is_app_running()) break;
  }
}