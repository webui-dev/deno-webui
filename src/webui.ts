/*
  WebUI Library 2.4.0

  http://webui.me
  https://github.com/webui-dev/deno-webui

  Copyright (c) 2020-2023 Hassan Draga.
  Licensed under MIT License.
  All rights reserved.
  Canada.
*/

import { existsSync } from "../deps.ts";
import { loadLib } from "./lib.ts";
import {
  BindCallback,
  Datatypes,
  Usize,
  WebUIEvent,
  WebUILib,
} from "./types.ts";
import { fromCString, toCString, WebUIError } from "./utils.ts";

// Register loaded lib (and allow mutiple lib source)
const libs: Map<string | symbol, WebUILib> = new Map();
const defaultLib = Symbol("defaultLib");

// Register windows to bind instance to WebUI.Event
const windows: Map<Usize, WebUI> = new Map();

export class WebUI {
  #window: Usize;
  #lib: WebUILib;

  /**
   * Loads webui lib if not done and instanciate a new window.
   * @returns Window id.
   * @param libPath - Full lib path.Use a local lib instead of precached one.
   * @param clearCache - Clear the cache used by the default static import of compatible webui lib.
   * @throws {WebUIError} - If optional local lib not found.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * const myWindow2 = new WebUI({ libPath: './local_webui_2.dll', clearCache: true })
   * ```
   */
  constructor(
    options: { libPath?: string; clearCache: boolean } = { clearCache: false },
  ) {
    if (options.libPath && !existsSync(options.libPath)) {
      throw new WebUIError(`File not found "${options.libPath}"`);
    }
    if (!libs.has(options.libPath ?? defaultLib)) {
      libs.set(options.libPath ?? defaultLib, loadLib(options));
    }
    this.#lib = libs.get(options.libPath ?? defaultLib)!;
    this.#window = this.#lib.symbols.webui_new_window();
    windows.set(this.#window, this);
  }

  /**
   * Show the window or update the UI with the new content.
   * @returns Promise that resolves when the client bridge is linked.
   * @param {string} content - Valid html content or same root file path.
   * @throws {WebUIError} - If lib return false status.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   *
   * // Show the current time
   * myWindow.show(`<html><p>It is ${new Date().toLocaleTimeString()}</p></html>`)
   *
   * // Show a local file
   * await myWindow.show('list.txt')
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   */
  async show(content: string) {
    const status = this.#lib.symbols.webui_show(
      this.#window,
      toCString(content),
    );
    if (!status) {
      throw new WebUIError(`unable to show content`);
    }

    for (let i = 0; i < 120; i++) { // 30 seconds timeout
      if (!this.isShown) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      } else {
        break;
      }
    }

    if (!this.isShown) {
      throw new WebUIError(`unable to show content`);
    }
  }

  /**
   * Show the window or update the UI with the new content with a specific browser.
   * @returns Promise that resolves when the client bridge is linked.
   * @param {string} content - valid html content or same root file path.
   * @param {number} browser - Browser to use.
   * @throws {WebUIError} - If lib return false status.
   * @example
   *  ```ts
   * const myWindow = new WebUI()
   *
   * // Show the current time
   * myWindow.showBrowser(`<html><p>It is ${new Date().toLocaleTimeString()}</p></html>`, WebUI.Browser.Firefox)
   *
   * // Show a local file
   * await myWindow.showBrowser('list.txt', Webui.Browser.Firefox)
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   */
  async showBrowser(
    content: string,
    browser: WebUI.Browser,
  ) {
    const status = this.#lib.symbols.webui_show_browser(
      this.#window,
      toCString(content),
      browser,
    );
    if (!status) {
      throw new WebUIError(`unable to show content`);
    }

    while (!this.isShown) {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  }

  /**
   * Checks if the window is currently running.
   * @returns Display state.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * const myWindow2 = new WebUI()
   *
   * myWindow1.show(`<html><p>View 1</p></html>`)
   *
   * myWindow1.isShown // true
   * myWindow2.isShown // false
   * ```
   */
  get isShown() {
    return this.#lib.symbols.webui_is_shown(this.#window);
  }

  /**
   * Closes the current window.
   * If there is no running window left, WebUI.wait() will break.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * const myWindow2 = new WebUI()
   *
   * myWindow1.show(`<html><p>View 1</p></html>`)
   * myWindow2.show(`<html><p>View 2</p></html>`)
   *
   * myWindow2.close()
   *
   * myWindow1.isShown // true
   * myWindow2.isShown // false
   * ```
   */
  close() {
    return this.#lib.symbols.webui_close(this.#window);
  }

  /**
   * Tries to close all opened windows and make WebUI.wait() break.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * const myWindow2 = new WebUI()
   *
   * myWindow1.show(`<html><p>View 1</p></html>`)
   * myWindow2.show(`<html><p>View 2</p></html>`)
   *
   * WebUI.exit()
   *
   * myWindow1.isShown // false
   * myWindow2.isShown // false
   * ```
   */
  static exit() {
    libs.forEach((lib) => lib.symbols.webui_exit());
  }

  /**
   * Execute a JavaScript string in the UI and returns a boolean indicating whether the
   * script execution was successful.
   * @param {string} script - js code to execute.
   * @param options - response timeout (0 means no timeout) and bufferSize,
   * default is `{ timeout: 0, bufferSize: 1024 * 8 }`.
   * @returns Promise that resolve or reject the client response.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(
   *  `<html>
   *    <p id="textElement"></p>
   *     <script>
   *      function updateText(text) {
   *        document.getElementById('textElement').innerText = text
   *        return 'ok'
   *      }
   *    </script>
   *  </html>`
   * )
   *
   * const response = await myWindow.script('return updateText("backend action")').catch(console.error)
   * // response == "ok"
   * ```
   */
  script(
    script: string,
    options?: {
      timeout?: number;
      bufferSize?: number;
    },
  ) {
    // Response Buffer
    const bufferSize =
      (options?.bufferSize !== undefined && options.bufferSize > 0)
        ? options.bufferSize
        : 1024 * 8;
    const buffer = new Uint8Array(bufferSize);
    const timeout = options?.timeout ?? 0;

    // Execute the script
    const status = this.#lib.symbols.webui_script(
      this.#window,
      toCString(script),
      timeout,
      buffer,
      bufferSize,
    );

    const response = fromCString(buffer);

    // TODO:
    // Call symbol asynchronously
    if (status) {
      return Promise.resolve(response);
    }
    return Promise.reject(response);
  }

  /**
   * Execute a JavaScript string in the UI without awaiting the result.
   * @param {string} script - js code to execute.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(
   *  `<html>
   *    <p id="textElement"></p>
   *     <script>
   *      function updateText(text) {
   *        document.getElementById('textElement').innerText = text
   *        return 'ok'
   *      }
   *    </script>
   *  </html>`
   * )
   *
   * myWindow.run('updateText("backend action")')
   * ```
   */
  run(script: string) {
    // Execute the script
    this.#lib.symbols.webui_run(
      this.#window,
      toCString(script),
    );
  }

  /**
   * Bind a callback function to a an HTML element
   * 
   * @param {string} id - DOM element id. Blank string bind to all DOM elements.
   * @param callback - The callback function.
   * 
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.show(
   *  `<html>
   *    <button id="myBtn"></button>
   *    <button OnClick="alert(myBackend('Test', 123456))"></button>
   *  </html>`
   * )
   *
   * myWindow.bind('myBtn', (e: WebUI.Event) => console.log(`${e.element} was clicked`));
   * myWindow.bind('myBackend', (e: WebUI.Event) => {
   *    const myArg1 = e.arg.string(0)
   *    const myArg2 = e.arg.number(1)
   *    return "backend response"
   * });
   * ```
   */
  bind<T extends Datatypes | undefined | void>(
    id: string,
    callback: BindCallback<T>,
  ) {
    const callbackResource = new Deno.UnsafeCallback(
      {
        // size_t webui_interface_bind(..., void (*func)(size_t, size_t, char*, size_t, size_t))
        // func (Window, EventType, Element, EventNumber, BindID)
        parameters: ["usize", "usize", "pointer", "usize", "usize"],
        result: "void",
      } as const,
      async (
        param_window: number,
        param_event_type: number,
        param_element: Deno.PointerValue,
        param_event_number: number,
        param_bind_id: number,
      ) => {
        // Create elements
        const win = param_window;
        const event_type = Math.trunc(param_event_type);
        const element = param_element !== null
          ? new Deno.UnsafePointerView(param_element).getCString()
          : "";
        const event_number = Math.trunc(param_event_number);
        const bind_id = Math.trunc(param_bind_id);

        // Set get argument methods
        const args = {
          number: (index: number): number => {
            return this.#lib.symbols.webui_interface_get_int_at(win, event_number, index) as number
          },
          string: (index: number): string => {
            return (
              new Deno.UnsafePointerView(
                this.#lib.symbols.webui_interface_get_string_at(win, event_number, index)
              ).getCString()
            ) as string
          },
          boolean: (index: number): boolean => {
            return this.#lib.symbols.webui_interface_get_bool_at(win, event_number, index) as boolean
          }
        }

        // Create struct
        const e: WebUIEvent = {
          window: windows.get(win)!,
          eventType: event_type,
          element: element,
          arg: args
        };

        // Call the user callback
        const result = await callback(e) as string;

        // Send back the response
        this.#lib.symbols.webui_interface_set_response(
          this.#window,
          event_number,
          toCString(result),
        );
      },
    );

    this.#lib.symbols.webui_interface_bind(
      this.#window,
      toCString(id),
      callbackResource.pointer,
    );
  }

  /**
   * Sets a handlers to respond to file requests of the browser.
   * 
   * @param handler - Callback that takes an URL and return a string of a byte array.
   *
   * @example
   * const myWindow = new WebUI()
   * 
   * myWindow.setFileHandler((myUrl: URL) => {
   *  if (myUrl.pathname === '/app.js') return "console.log('hello from client')"
   *  if (myUrl.pathname === '/img.png') return imgBytes
   *  throw new Error(`uknown request "${myUrl.pathname}""`)
   * })
   *
   * myWindow.show(
   *  `<html>
   *     <script src="app.js"></script>
   *     <img src="img.png" />
   *  </html>`
   * )
   */
  setFileHandler(handler: (url: URL) => string | Uint8Array) {
    // const void* (*handler)(const char *filename, int *length)
    const cb = new Deno.UnsafeCallback(
      {
        parameters: ["buffer", "pointer"],
        result: "pointer",
      },
      (
        pointerUrl: Deno.PointerValue,
        pointerLength: Deno.PointerValue,
      ) => {
        const url = pointerUrl !== null
          ? new Deno.UnsafePointerView(pointerUrl).getCString()
          : "";

        const response = handler(new URL(url, "http://localhost"));
        const buffer = typeof response === "string"
          ? toCString(response)
          : response;

        const lengthView = new Int32Array(
          Deno.UnsafePointerView.getArrayBuffer(pointerLength, 4),
        );
        lengthView[0] = buffer.length;

        return Deno.UnsafePointer.of(buffer);
      },
    );

    this.#lib.symbols.webui_set_file_handler(
      this.#window,
      cb.pointer,
    );
  }

  /**
   * Sets the profile name and path for the current window.
   * @param name - Profile name.
   * @param path - Profile path.
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.setProfile("myProfile", "/path/to/profile");
   * ```
   */
  setProfile(name: string, path: string) {
    return this.#lib.symbols.webui_set_profile(
      this.#window,
      toCString(name),
      toCString(path),
    );
  }

  /**
   * Clean all memory resources. WebUI is not usable after this call.
   */
  clean() {
    this.#lib.symbols.webui_clean();
  }

  /**
   * Waits until all opened windows are closed for preventing exiting the main thread.
   * 
   * @exemple
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(`<html>Your Page</html>`)
   * 
   * await WebUI.wait() // Async wait until all windows are closed
   * 
   * // You can show windows again, or call WebUI.clean()
   * ```
   */
  static async wait() {
    // Wait for all opened lib to resolve
    // for (const lib of libs.values()) {
    //   await lib.symbols.webui_wait();
    // }

    // TODO:
    // The `await lib.symbols.webui_wait()` will block `callbackResource`
    // so all events (clicks) will be executed when `webui_wait()` finish.
    // as a work around, we are going to use `sleep()`.
    let sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let leave = false;
    while (!leave) {
      await sleep(10);
      leave = true;
      for (const lib of libs.values()) {
        if (lib.symbols.webui_interface_is_app_running()) {
          leave = false;
        }
      }
    }
  }

  static get version() {
    return "2.4.0";
  }
}

// Deno-lint-ignore no-namespace
export namespace WebUI {
  export type Event = WebUIEvent;
  export enum Browser {
    NoBrowser = 0, // 0. No web browser
    AnyBrowser, // 1. Default recommended web browser
    Chrome, // 2. Google Chrome
    Firefox, // 3. Mozilla Firefox
    Edge, // 4. Microsoft Edge
    Safari, // 5. Apple Safari
    Chromium, // 6. The Chromium Project
    Opera, // 7. Opera Browser
    Brave, // 8. The Brave Browser
    Vivaldi, // 9. The Vivaldi Browser
    Epic, // 10. The Epic Browser
    Yandex, // 11. The Yandex Browser
    ChromiumBased, // 12. Any Chromium based browser
  }
}
