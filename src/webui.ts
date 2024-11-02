/*
  WebUI Library 2.5.0
  http://webui.me
  https://github.com/webui-dev/deno-webui
  Copyright (c) 2020-2023 Hassan Draga.
  Licensed under MIT License.
  All rights reserved.
  Canada.
*/

import { loadLib } from "./lib.ts";
import {
  BindCallback,
  Datatypes,
  Usize,
  WebUIEvent,
  WebUILib,
} from "./types.ts";
import { fromCString, toCString, WebUIError } from "./utils.ts";

// Register windows to bind instance to WebUI.Event
const windows: Map<Usize, WebUI> = new Map();

// Global lib entry
let _lib: WebUILib;

export class WebUI {
  #window: Usize;
  #lib: WebUILib;

  /**
   * Instanciate a new WebUI window.
   * @returns Window id.
   * @throws {WebUIError} - If optional local lib not found.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * ```
   */
  constructor() {
    this.#lib = loadLib();
    this.#window = this.#lib.symbols.webui_new_window();
    windows.set(this.#window, this);
    // Global lib entry
    if (typeof _lib === 'undefined') {
      // The ref _lib is used by static members like `wait()`
      _lib = this.#lib;
    }
  }

  /**
   * Set root folder for proper loading resources
   * @param rootFolder Root folder to set
   * @throws {WebUIError} - If lib return false status.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   *
   * // Show the current time
   * myWindow.setRootFolder('some/root/folder')
   *
   * // Show a local file
   * await myWindow.show('some/root/folder/index.html')
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   */
  setRootFolder(rootFolder: string) {
    const status = this.#lib.symbols.webui_set_root_folder(
        this.#window,
        toCString(rootFolder),
    );
    if (!status) {
      throw new WebUIError(`unable to set root folder`);
    }
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
   * myWindow.show(`<html><script src="webui.js">/script> <p>It is ${new Date().toLocaleTimeString()}</p> </html>`)
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
      throw new WebUIError(`unable to start the browser`);
    }

    for (let i = 0; i < 120; i++) { // 30 seconds timeout
      if (!this.isShown) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      } else {
        break;
      }
    }

    if (!this.isShown) {
      throw new WebUIError(`unable to connect to the browser`);
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
   * myWindow.showBrowser(`<html><script src="webui.js">/script> Hi, This is Chrome! </html>`, WebUI.Browser.Chrome)
   *
   * // Show a local file
   * await myWindow.showBrowser('list.txt', Webui.Browser.Chrome)
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
      throw new WebUIError(`unable to start the browser`);
    }

    for (let i = 0; i < 120; i++) { // 30 seconds timeout
      if (!this.isShown) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      } else {
        break;
      }
    }

    if (!this.isShown) {
      throw new WebUIError(`unable to connect to the browser`);
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
   * myWindow1.show(`<html><script src="webui.js">/script> <p>View 1</p> </html>`)
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
   * myWindow1.show(`<html><script src="webui.js">/script> <p>View 1</p> </html>`)
   * myWindow2.show(`<html><script src="webui.js"></script> <p>View 2</p> </html>`)
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
   * Execute a JavaScript string in the UI and returns a boolean indicating whether the
   * script execution was successful.
   * @param {string} script - js code to execute.
   * @param options - response timeout (0 means no timeout), bufferSize,
   * default is `{ timeout: 0, bufferSize: 1024 * 1000 }`.
   * @returns Promise that resolve or reject the client response.
   * @example
   * ```ts
   * const response = await myWindow.script('return 6 + 4;').catch(console.error)
   * // response == "10"
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
        : 1024 * 1000;
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
   * Execute a JavaScript string in the UI without waiting for the result.
   * @param {string} script - js code to execute.
   * @example
   * ```ts
   * myWindow.run('alert("Hello!")')
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
   *    <script src="webui.js"></script>
   *    <button id="myBtn">Click Me</button>
   *  </html>`
   * )
   *
   * function myFunc(e: WebUI.Event) {
   *   console.log(`${e.element} was clicked`);
   * }
   * myWindow.bind('myBtn', myFunc);
   * ```
   */
  bind<T extends Datatypes | undefined | void>(
    id: string,
    callback: BindCallback<T>,
  ) {
    // Create the callback
    const callbackResource = new Deno.UnsafeCallback(
      {
        // size_t webui_interface_bind(..., void (*func)(size_t, size_t, char*, size_t, size_t))
        // func = (Window, EventType, Element, EventNumber, BindID)
        parameters: ["usize", "usize", "pointer", "usize", "usize"],
        result: "void",
      } as const,
      async (
        param_window: number | bigint,
        param_event_type: number | bigint,
        param_element: Deno.PointerValue,
        param_event_number: number | bigint,
        param_bind_id: number | bigint,
      ) => {
        // Create elements
        const win = param_window;
        const event_type = typeof param_event_type === 'bigint'
          ? Number(param_event_type)
          : Math.trunc(param_event_type);
        const element = param_element !== null
          ? new Deno.UnsafePointerView(param_element).getCString()
          : "";
        const event_number = typeof param_event_number === 'bigint'
          ? Number(param_event_number)
          : Math.trunc(param_event_number);
        const bind_id = typeof param_bind_id === 'bigint'
          ? Number(param_bind_id)
          : Math.trunc(param_bind_id);

        // Set get argument methods
        const args = {
          number: (index: number): number => {
            return this.#lib.symbols.webui_interface_get_int_at(win, event_number, index) as number
          },
          string: (index: number): string => {
            return (
              new Deno.UnsafePointerView(
                (this.#lib.symbols.webui_interface_get_string_at(win, event_number, index) as Deno.PointerObject<unknown>)
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
        const result: string = await callback(e) as string;

        // Send back the response
        this.#lib.symbols.webui_interface_set_response(
          this.#window,
          event_number,
          toCString(result),
        );
      },
    );
    // Pass the callback pointer to WebUI
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
   *  throw new Error(`Unknown request "${myUrl.pathname}""`)
   * })
   *
   * myWindow.show(
   *  `<html>
   *     <script src="webui.js">/script>
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

        // const winUrl: string = this.getUrl();
        const response = handler(new URL(url, "http://localhost"));
        const buffer = typeof response === "string"
          ? toCString(response)
          : response;

        const lengthView = new Int32Array(
          Deno.UnsafePointerView.getArrayBuffer((pointerLength as Deno.PointerObject<unknown>), 4),
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
   * Set the kiosk mode of a WebUI window.
   * 
   * @param status - True to enable kiosk mode, false to disable.
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.setKiosk(true);
   * ```
   */
  setKiosk(status: boolean): void {
    this.#lib.symbols.webui_set_kiosk(this.#window, status);
  }

  /**
   * Close a specific window and free all memory resources.
   */
  destroy(): void {
    this.#lib.symbols.webui_destroy(this.#window);
  }

  /**
   * Set the default embedded HTML favicon.
   * 
   * @param icon - The icon as string: `<svg>...</svg>`
   * @param iconType - The icon type: `image/svg+xml`
   */
  setIcon(icon: string, iconType: string): void {
    this.#lib.symbols.webui_set_icon(this.#window, toCString(icon), toCString(iconType));
  }

  /**
   * Safely send raw data to the UI.
   * 
   * @param functionName - The name of the function to send data to.
   * @param raw - The raw data to send.
   */
  sendRaw(functionName: string, raw: ArrayBuffer): void {
    this.#lib.symbols.webui_send_raw(this.#window, toCString(functionName), raw, ArrayBuffer.length);
  }

  /**
   * Set a window in hidden mode. Should be called before `.show()`.
   * 
   * @param status - True to hide, false to show.
   */
  setHide(status: boolean): void {
    this.#lib.symbols.webui_set_hide(this.#window, status);
  }

  /**
   * Set the window size.
   * 
   * @param width - The width of the window.
   * @param height - The height of the window.
   */
  setSize(width: number, height: number): void {
    this.#lib.symbols.webui_set_size(this.#window, width, height);
  }

  /**
   * Set the window position.
   * 
   * @param x - The x-coordinate of the window.
   * @param y - The y-coordinate of the window.
   */
  setPosition(x: number, y: number): void {
    this.#lib.symbols.webui_set_position(this.#window, x, y);
  }

  /**
   * Get the full current URL.
   * 
   * @return - The current URL.
   */
  getUrl(): string {
    return (
      new Deno.UnsafePointerView(
        (this.#lib.symbols.webui_get_url(this.#window) as Deno.PointerObject<unknown>)
      ).getCString()
    ) as string
  }

  /**
   * Allow the window address to be accessible from a public network.
   * 
   * @param status - True to allow public access, false to restrict.
   */
  setPublic(status: boolean): void {
    this.#lib.symbols.webui_set_public(this.#window, status);
  }

  /**
   * Navigate to a specific URL.
   * 
   * @param url - The URL to navigate to.
   */
  navigate(url: string): void {
    this.#lib.symbols.webui_navigate(this.#window, toCString(url));
  }

  /**
   * Delete the web-browser local profile folder.
   */
  deleteProfile(): void {
    this.#lib.symbols.webui_delete_profile(this.#window);
  }

  /**
   * Get the ID of the parent process (The web browser may re-create
   * another new process).
   * 
   * @return - The parent process ID.
   */
  getParentProcessId(): number {
    return this.#lib.symbols.webui_get_parent_process_id(this.#window);
  }

  /**
   * Get the ID of the last child process.
   * 
   * @return - The last child process ID.
   */
  getChildProcessId(): number {
    return this.#lib.symbols.webui_get_child_process_id(this.#window);
  }

  /**
   * Set a custom web-server network port to be used by WebUI.
   * This can be useful to determine the HTTP link of `webui.js` in case
   * you are trying to use WebUI with an external web-server like NGNIX
   * 
   * @param port - The port number.
   * @return - True if the port is set successfully.
   */
  setPort(port: number): boolean {
    return this.#lib.symbols.webui_set_port(this.#window, port);
  }

  /**
   * Chose between Deno and Nodejs as runtime for .js and .ts files.
   * 
   * @param runtime - The runtime value.
   */
  setRuntime(runtime: number): void {
    this.#lib.symbols.webui_set_runtime(this.#window, runtime);
  }

  // --[ Static Methods ]------------------------

  /**
   * Tries to close all opened windows and make WebUI.wait() break.
   * @example
   * ```ts
   * const myWindow1 = new WebUI()
   * const myWindow2 = new WebUI()
   *
   * myWindow1.show(`<html><script src="webui.js">/script> <p>View 1</p> </html>`)
   * myWindow2.show(`<html><script src="webui.js"></script> <p>View 2</p> </html>`)
   *
   * WebUI.exit()
   *
   * myWindow1.isShown // false
   * myWindow2.isShown // false
   * ```
   */
  static exit() {
    _lib.symbols.webui_exit();
  }

  /**
   * Set certificate
   * @param certificatePem Set certificate
   * @param privateKeyPem Set private key
   * @throws {WebUIError} - If lib return false status.
   * @example
   * ```ts
   * const myWindow = new WebUI()
   *
   * // Show the current time
   * myWindow.setRootFolder('some/root/folder')
   *
   * const certificatePem = await Deno.readTextFile("some/root/certificate.pem");
   * const privateKeyPem = await Deno.readTextFile("some/root/private_key.pem");
   * WebUI.setTLSCertificate(certificatePem, privateKeyPem);
   *
   * // Show a local file
   * await myWindow.show('some/root/folder/index.html')
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   */
  static setTLSCertificate(certificatePem: string, privateKeyPem: string) {
    const status = _lib.symbols.webui_set_tls_certificate(
        toCString(certificatePem),
        toCString(privateKeyPem),
    );
    if (!status) {
      throw new WebUIError(`unable to set certificate`);
    }
  }

  /**
   * Waits until all opened windows are closed for preventing exiting the main thread.
   * 
   * @exemple
   * ```ts
   * const myWindow = new WebUI()
   * myWindow.show(`<html><script src="webui.js">/script> Your Page... </html>`)
   * 
   * await WebUI.wait() // Async wait until all windows are closed
   * 
   * // You can show windows again, or call WebUI.clean()
   * ```
   */
  static async wait() {
    // TODO:
    // The `await _lib.symbols.webui_wait()` will block `callbackResource`
    // so all events (clicks) will be executed when `webui_wait()` finish.
    // as a work around, we are going to use `sleep()`.
    let sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    while (1) {
      await sleep(100);
      if (!_lib.symbols.webui_interface_is_app_running()) {
        break;
      }
    }
  }

  /**
   * Delete all local web-browser profiles folder.
   */
  static deleteAllProfiles(): void {
    _lib.symbols.webui_delete_all_profiles();
  }

  /**
   * Base64 encoding. Use this to safely send text based data to the UI.
   * 
   * @param str - The string to encode.
   * @return - The encoded string.
   */
  static encode(str: string): string {
    return (
      new Deno.UnsafePointerView(
        (_lib.symbols.webui_encode(toCString(str)) as Deno.PointerObject<unknown>)
      ).getCString()
    ) as string
  }

  /**
   * Base64 decoding. Use this to safely decode received Base64 text from the UI.
   * 
   * @param str - The string to decode.
   * @return - The decoded string.
   */
  static decode(str: string): string {
    return (
      new Deno.UnsafePointerView(
        (_lib.symbols.webui_decode(toCString(str)) as Deno.PointerObject<unknown>)
      ).getCString()
    ) as string
  }

  /**
   * Safely allocate memory using the WebUI memory management system.
   * 
   * @param size - The size of the memory block to allocate.
   * @return - A pointer to the allocated memory block.
   */
  static malloc(size: number): Deno.PointerValue {
    return _lib.symbols.webui_malloc(size);
  }

  /**
   * Safely free a memory block allocated by WebUI.
   * 
   * @param ptr - The pointer to the memory block.
   */
  static free(ptr: Deno.PointerValue): void {
    _lib.symbols.webui_free(ptr);
  }

  /**
   * Set the maximum time in seconds to wait for the browser to start.
   * 
   * @param second - The timeout duration in seconds.
   */
  static setTimeout(second: number): void {
    _lib.symbols.webui_set_timeout(second);
  }

  /**
   * Clean all memory resources. WebUI is not usable after this call.
   */
  static clean() {
    _lib.symbols.webui_clean();
  }

  static get version() {
    return "2.5.0";
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
