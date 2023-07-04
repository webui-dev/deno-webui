/*
  WebUI Library 2.3.0

  http://webui.me
  https://github.com/webui-dev/deno-webui

  Copyright (c) 2020-2023 Hassan Draga.
  Licensed under MIT License.
  All rights reserved.
  Canada.
*/

import { loadLib } from "./lib.ts";
import { BindCallback, Event, Js, Usize } from "./types.ts";
import { existsSync } from "../deps.ts";
import { sleep, stringToUint8array, uint8arrayToString } from "./utils.ts";

export type { Event } from "./types.ts";

export const version = "2.3.0";

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

export const js = {
  timeout: 0,
  bufferSize: 1024 * 8,
  response: "",
};

let webuiLib: Awaited<ReturnType<typeof loadLib>>;
let loaded = false;
let libPath: string | undefined = undefined;

export function setLibPath(path: string) {
  if (!existsSync(path)) {
    throw new Error(`WebUI: File not found "${path}"`);
  }
  libPath = path;
}

export async function newWindow(): Promise<Usize> {
  if (loaded) {
    webuiLib = await loadLib(libPath);
    loaded = true;
  }
  return webuiLib.symbols.webui_new_window();
}

export function show(win: Usize, content: string): number {
  return webuiLib.symbols.webui_show(win, stringToUint8array(content));
}

export function showBrowser(
  win: Usize,
  content: string,
  browser: number,
): number {
  return webuiLib.symbols.webui_show_browser(
    win,
    stringToUint8array(content),
    browser,
  );
}

export function isShown(win: Usize) {
  return webuiLib.symbols.webui_is_shown(win);
}
export function close(win: Usize) {
  return webuiLib.symbols.webui_close(win);
}
export function setMultiAccess(win: Usize, status: boolean) {
  return webuiLib.symbols.webui_set_multi_access(win, status);
}

export function exit() {
  webuiLib.symbols.webui_exit();
}

export function script(win: Usize, js: Js, script: string): boolean {
  // Response Buffer
  const size: number = js.bufferSize > 0 ? js.bufferSize : 1024 * 8;
  const buffer = new Uint8Array(size);

  // Execute the script
  const status = webuiLib.symbols.webui_script(
    win,
    stringToUint8array(script),
    js.timeout,
    buffer,
    size,
  );

  // Update
  js.response = String(uint8arrayToString(buffer));

  return Boolean(status);
}

export function run(win: Usize, script: string): boolean {
  // Execute the script
  const status = webuiLib.symbols.webui_run(
    win,
    stringToUint8array(script),
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
      const e: Event = {
        win: win,
        eventType: event_type,
        element: element,
        data: data,
      };

      // Call the user callback
      const result = String(func(e));

      // Send back the response
      webuiLib.symbols.webui_interface_set_response(
        win,
        event_number,
        stringToUint8array(result),
      );
    },
  );

  webuiLib.symbols.webui_interface_bind(
    win,
    stringToUint8array(element),
    callbackResource.pointer,
  );
}

// TODO: We should use the Non-blocking FFI to call
// `webui_lib.symbols.webui_wait()`. but it breaks
// the Deno script main thread. Lets do it in another way for now.
export async function wait() {
  while (true) {
    await sleep(10);
    if (!webuiLib.symbols.webui_interface_is_app_running()) break;
  }
}
