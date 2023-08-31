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
  JSONValue,
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
   * Update the UI with the new content.
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

    while (!this.isShown) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Update the UI with the new content with a specific browser.
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
   * After the window is loaded, the URL is not valid anymore for safety.
   * WebUI will show an error if someone else tries to access the URL.
   * To allow multi-user access to the same URL, you can use multiAccess.
   * @param {boolean} status - Multi access status of the window.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.setMultiAccess(true) // UI is accessible through the page url
   * ```
   */
  setMultiAccess(status: boolean) {
    return this.#lib.symbols.webui_set_multi_access(this.#window, status);
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
   * The `bind` function in TypeScript binds a callback function to a web UI event, passing the event
   * details to the callback and sending back the response.
   * @param {string} idOrlabel - DOM element id or webui label to bind the code with. Blank string bind to all DOM elements.
   * @param callback - Callback to execute.
   * If a value is returned by the callback it will be sent to client and must be a valid JSON value.
   * **Value will be stringified.**
   * @example
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(
   *  `<html>
   *    <button id="btn"></button>
   *     <script>
   *      const response = await webui.call('myLabel', 'payload') // Global function injected by webui loader
   *    </script>
   *  </html>`
   * )
   *
   * myWindow.bind('btn', ({ element }) => console.log(`${element} was clicked`))
   * myWindow.bind('myLabel', ({ data }) => {
   *  console.log(`UI send "${data}"`)
   *  return "backend response"
   * })
   * myWindow.bind('', (event) => console.log(`new UI event was fired (${JSON.stringify(event)})`))
   * ```
   */
  bind<T extends JSONValue | undefined | void>(
    idOrlabel: string,
    callback: BindCallback<T>,
  ) {
    const callbackResource = new Deno.UnsafeCallback(
      {
        // unsigned int webui_interface_bind(..., void (*func)(size_t, size_t, char*, char*, size_t, size_t))
        parameters: ["usize", "usize", "pointer", "pointer", "usize", "usize"],
        result: "void",
      } as const,
      async (
        param_window: number,
        param_event_type: number,
        param_element: Deno.PointerValue,
        param_data: Deno.PointerValue,
        param_event_size: number,
        param_event_number: number,
      ) => {
        // Create elements
        const win = param_window;
        const event_type = Math.trunc(param_event_type);
        const element = param_element !== null
          ? new Deno.UnsafePointerView(param_element).getCString()
          : "";
        const data = param_data !== null
          ? new Deno.UnsafePointerView(param_data).getCString()
          : "";
        const event_number = Math.trunc(param_event_number);

        // Create struct
        const e: WebUIEvent = {
          window: windows.get(win)!,
          eventType: event_type,
          element: element,
          data: data,
        };

        // Call the user callback
        const result = JSON.stringify(await callback(e));

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
      toCString(idOrlabel),
      callbackResource.pointer,
    );
  }

  /**
   * Sets a handlers to respond to file requests of the browser.
   * @param handler - Callback that takes an URL and return a string of a byte array.
   *
   * __mime-type of the content only depends of the pathname extension.__
   * __handler need to be set before rendering the ui__
   *
   * @example
   * const myWindow = new WebUI()
   *
   * // Set handler before calling myWindow.show
   * myWindow.setFileHandler(({ pathname }) => {
   *  if (pathname === '/app.js') return "console.log('hello from client')"
   *  if (pathname === '/img.png') return imgBytes
   *  throw new Error(`uknown request "${pathname}""`)
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
        parameters: ["buffer"],
        result: "pointer",
      },
      (
        pointerUrl: Deno.PointerValue,
      ) => {
        const url = pointerUrl !== null
          ? new Deno.UnsafePointerView(pointerUrl).getCString()
          : "";

        const response = handler(new URL(url, "http://localhost"));
        const buffer = typeof response === "string"
          ? toCString(response)
          : response;
        return Deno.UnsafePointer.of(buffer);
      },
    );

    this.#lib.symbols.webui_set_file_handler(
      this.#window,
      cb.pointer,
    );
  }

  /**
   * Waits until all opened windows are closed for preventing exiting the main thread.
   * @exemple
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(`<html>Your Page</html>`)
   * // ...
   * await WebUI.wait() // Async wait until all windows are closed
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
    let leave = false
    while(!leave) {
      await sleep(10);
      leave = true
      for (const lib of libs.values()) {
        if(lib.symbols.webui_interface_is_app_running())
          leave = false
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
    AnyBrowser, // 0. Default recommended web browser
    Chrome, // 1. Google Chrome
    Firefox, // 2. Mozilla Firefox
    Edge, // 3. Microsoft Edge
    Safari, // 4. Apple Safari
    Chromium, // 5. The Chromium Project
    Opera, // 6. Opera Browser
    Brave, // 7. The Brave Browser
    Vivaldi, // 8. The Vivaldi Browser
    Epic, // 9. The Epic Browser
    Yandex0, // 10. The Yandex Browser
  }
}
