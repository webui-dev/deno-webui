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
import {
  sleep,
  stringToUint8array,
  uint8arrayToString,
  WebUiError,
} from "./utils.ts";

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

/**
 * Use a local lib instead of precached one.
 * Use before all other functions.
 * @throws {Error} If lib not found.
 * @param {string} path - Full lib path.
 * @example
 * ```ts
 * webui.setLibPath('./local_webui_2.dll')
 * const window = webui.newWindow()
 * ```
 */
export function setLibPath(path: string) {
  if (!existsSync(path)) {
    throw new Error(`WebUI: File not found "${path}"`);
  }
  libPath = path;
}

/**
 * loads webui lib if not done and create a new window.
 * @returns Window id.
 * @example
 * ```ts
 * const window1 = await webui.newWindow()
 * const window2 = await webui.newWindow()
 * ```
 */
export async function newWindow(): Promise<Usize> {
  if (loaded) {
    webuiLib = await loadLib(libPath);
    loaded = true;
  }
  return webuiLib.symbols.webui_new_window();
}

/**
 * Update the ui with the new content.
 * @param {Usize} win - The window where the content will be displayed.
 * @param {string} content - valid html content or same root file path.
 * @example
 * ```ts
 * const window = await webui.newWindow()
 * //Show the current time
 * webui.show(window, `<html><p>It is ${new Date().toLocaleTimeString()}</p></html>`)
 * //Show a local file
 * webui.show(window, 'list.txt')
 * ```
 */
export function show(win: Usize, content: string) {
  const code = webuiLib.symbols.webui_show(win, stringToUint8array(content));
  if (code !== 1) {
    throw new WebUiError(`Unable to show content [code: ${code}]`);
  }
}

/**
 * Update the ui with the new content with a specific browser.
 * @param {Usize} win - The window where the content will be displayed.
 * @param {string} content - valid html content or same root file path.
 * @param {number} browser - Browser to use.
 * @example
 *  ```ts
 * const window = await webui.newWindow()
 * //Show the current time
 * webui.showBrowser(window, `<html><p>It is ${new Date().toLocaleTimeString()}</p></html>`, webui.browser.Firefox)
 * //Show a local file
 * webui.showBrowser(window, 'list.txt', webui.browser.Firefox)
 * ```
 */
export function showBrowser(
  win: Usize,
  content: string,
  browser: number,
) {
  const code = webuiLib.symbols.webui_show_browser(
    win,
    stringToUint8array(content),
    browser,
  );
  if (code !== 1) {
    throw new WebUiError(`Unable to show content [code: ${code}]`);
  }
}

/**
 * Checks if a window is currently running.
 * @param {Usize} win - The window to check display status.
 * @returns Display state.
 * @example
 * ```ts
 * const window1 = await webui.newWindow()
 * const window2 = await webui.newWindow()
 * webui.show(window1, `<html><p>View 1</p></html>`)
 *
 * webui.isShown(window1) //true
 * webui.isShown(window2) //false
 * ```
 */
export function isShown(win: Usize) {
  return webuiLib.symbols.webui_is_shown(win);
}

/**
 * Closes a specific window.
 * If there is no running window left wait will break.
 * @param {Usize} win - The window to close.
 * @example
 * ```ts
 * const window1 = await webui.newWindow()
 * const window2 = await webui.newWindow()
 * webui.show(window1, `<html><p>View 1</p></html>`)
 * webui.show(window2, `<html><p>View 2</p></html>`)
 *
 * webui.close(window2)
 *
 * webui.isShown(window1) //true
 * webui.isShown(window2) //false
 * ```
 */
export function close(win: Usize) {
  return webuiLib.symbols.webui_close(win);
}

/**
 * After the window is loaded, the URL is not valid anymore for safety.
 * WebUI will show an error if someone else tries to access the URL.
 * To allow multi-user access to the same URL, you can use multiAccess.
 * @param {Usize} win - The window to manage.
 * @param {boolean} status - Multi access status of the window.
 * @example
 * ```ts
 * const window = await webui.newWindow()
 * webui.setMultiAccess(window, true) //ui is accessible through the page url
 * ```
 */
export function setMultiAccess(win: Usize, status: boolean) {
  return webuiLib.symbols.webui_set_multi_access(win, status);
}

/**
 * Tries to close all opened windows and make Wait break.
 * @example
 * ```ts
 * const window1 = await webui.newWindow()
 * const window2 = await webui.newWindow()
 * webui.show(window1, `<html><p>View 1</p></html>`)
 * webui.show(window2, `<html><p>View 2</p></html>`)
 *
 * webui.exit()
 * webui.isShown(window1) //false
 * webui.isShown(window2) //false
 * ```
 */
export function exit() {
  webuiLib.symbols.webui_exit();
}

/**
 * Execute client code from backend.
 * Execute a JavaScript script string in a web UI and returns a boolean indicating whether the
 * script execution was successful.
 * @param {Usize} win - The window to execute the script in.
 * @param {Js} js - webui.js object.
 * @param {string} script - js code to execute.
 * @returns execution status.
 * @example
 * ```ts
 * const window = await webui.newWindow()
 * webui.show(
 *  window,
 *  `<html>
 *    <p id="text"></p>
 *     <script>
 *      function updateText(text) {
 *        document.getElementById('text').innerText = text
 *        return 'ok'
 *      }
 *    </script>
 *  </html>`
 * )
 *
 * webui.script(window, webui.js, 'updateText("backend action")')
 * webui.js.response //"ok"
 * ```
 */
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

/**
 * Execute client code from backend.
 * Execute a JavaScript script string in a web UI without awaiting the result.
 * @param {Usize} win - The window to execute the script in.
 * @param {string} script - js code to execute.
 * @returns execution status.
 * @example
 * ```ts
 * const window = await webui.newWindow()
 * webui.show(
 *  window,
 *  `<html>
 *    <p id="text"></p>
 *     <script>
 *      function updateText(text) {
 *        document.getElementById('text').innerText = text
 *        return 'ok'
 *      }
 *    </script>
 *  </html>`
 * )
 *
 * webui.run(window, 'updateText("backend action")')
 * ```
 */
export function run(win: Usize, script: string): boolean {
  // Execute the script
  const status = webuiLib.symbols.webui_run(
    win,
    stringToUint8array(script),
  );

  return Boolean(status);
}

/**
 * The `bind` function in TypeScript binds a callback function to a web UI event, passing the event
 * details to the callback and sending back the response.
 * @param {Usize} win - The window to bind.
 * @param {string} elementOrlabel - DOM element id or webui label to bind the code with. Blank string bind to all DOM elements.
 * @param callback - Callback to execute.
 * @example
 * ```ts
 * const window = await webui.newWindow()
 * webui.show(
 *  window,
 *  `<html>
 *    <button id="btn"></button>
 *     <script>
 *      const response = await webui_fn('myLabel', 'payload')
 *    </script>
 *  </html>`
 * )
 *
 * webui.bind(window, 'btn', ({ element }) => console.log(`${element} was clicked`))
 * webui.bind(window, 'myLabel', ({ data }) => {
 *  console.log(`ui send "${data}"`)
 *  return "backend response"
 * })
 * webui.bind(window, '', (event) => console.log(`new ui event was fired (${JSON.stringify(event)})`))
 * ```
 */
export function bind<T extends string | number | boolean | undefined | void>(
  win: Usize,
  elementOrlabel: string,
  callback: BindCallback<T>,
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
      const result = String(callback(e));

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
    stringToUint8array(elementOrlabel),
    callbackResource.pointer,
  );
}

// TODO: We should use the Non-blocking FFI to call
// `webui_lib.symbols.webui_wait()`. but it breaks
// the Deno script main thread. Lets do it in another way for now.
/**
 * Waits until all web UI was closed for preventing exiting the main thread.
 * @exemple
 * ```ts
 * const window = await webui.newWindow()
 * webui.show(window, `<html><p>Your page</p></html>`)
 * //code ...
 * webui.show(window, 'list.txt')
 * //code ...
 * webui.wait() // aync wait until all windows are closed
 * ```
 */
export async function wait() {
  while (true) {
    await sleep(10);
    if (!webuiLib.symbols.webui_interface_is_app_running()) break;
  }
}
