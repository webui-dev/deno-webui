/*
  WebUI Deno 2.5.12
  http://webui.me
  https://github.com/webui-dev/deno-webui
  Copyright (c) 2020-2025 Hassan Draga.
  Licensed under MIT License.
  All rights reserved.
  Canada.
*/

import { loadLib } from "./lib.ts";
import type {
  BindCallback,
  Datatypes,
  Usize,
  WebUIEvent,
  WebUILib,
} from "./types.ts";
import { fromCString, toCString, WebUIError } from "./utils.ts";
import metadata from "../deno.json" with { type: "json" };

// Register windows to bind instance to WebUI.Event
const windows: Map<Usize, WebUI> = new Map();

// Global lib entry
let _lib: WebUILib;

/**
 * Represents a WebUI window instance. Allows interaction with a web browser
 * window, including displaying HTML content, executing JavaScript, and binding
 * backend functions to UI elements.
 */
export class WebUI {
  #window: Usize = 0;
  #lib: WebUILib;
  #isFileHandler: boolean = false;

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
    WebUI.init(); // Init lib if not already initialized
    this.#lib = _lib;
    this.#window = _lib.symbols.webui_new_window();
    windows.set(BigInt(this.#window), this);
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
      BigInt(this.#window),
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
   * await myWindow.show(`<html><script src="webui.js">/script> <p>It is ${new Date().toLocaleTimeString()}</p> </html>`)
   *
   * // Show a local file
   * await myWindow.show('list.txt')
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   * @note this function blocks on macos
   */
  async show(content: string) {
    const status = await this.#lib.symbols.webui_show(
      BigInt(this.#window),
      toCString(content),
    );
    if (!this.#isFileHandler) {
      // Check if window is lanched
      if (!status) {
        throw new WebUIError(`unable to start the browser`);
      }
      // Wait for window connection
      for (let i = 0; i < 120; i++) { // 30 seconds timeout
        if (!this.isShown) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        } else {
          break;
        }
      }
      // Check if window is connected
      if (!this.isShown) {
        throw new WebUIError(`unable to connect to the browser`);
      }
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
   * await myWindow.showBrowser(`<html><script src="webui.js">/script> Hi, This is Chrome! </html>`, WebUI.Browser.Chrome)
   *
   * // Show a local file
   * await myWindow.showBrowser('list.txt', Webui.Browser.Chrome)
   *
   * // Await to ensure WebUI.script and WebUI.run can send datas to the client
   * console.assert(myWindow.isShown, true)
   * ```
   * @note this function blocks on macos
   */
  async showBrowser(
    content: string,
    browser: WebUI.Browser,
  ) {
    const status = await this.#lib.symbols.webui_show_browser(
      BigInt(this.#window),
      toCString(content),
      BigInt(browser),
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
  get isShown(): boolean {
    return this.#lib.symbols.webui_is_shown(BigInt(this.#window));
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
  close(): void {
    return this.#lib.symbols.webui_close(BigInt(this.#window));
  }

  /**
   * Minimize a WebView window.
   *
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.minimize();
   * ```
   */
  minimize(): void {
    this.#lib.symbols.webui_minimize(BigInt(this.#window));
  }

  /**
   * Maximize a WebView window.
   *
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.maximize();
   * ```
   */
  maximize(): void {
    this.#lib.symbols.webui_maximize(BigInt(this.#window));
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
  ): Promise<string> {
    // Response Buffer
    const bufferSize =
      (options?.bufferSize !== undefined && options.bufferSize > 0)
        ? options.bufferSize
        : 1024 * 1000;
    const buffer = new Uint8Array(bufferSize);
    const timeout = options?.timeout ?? 0;

    // Execute the script
    const status = this.#lib.symbols.webui_script(
      BigInt(this.#window),
      toCString(script),
      BigInt(timeout),
      buffer,
      BigInt(bufferSize),
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
   * Same as `.script()`, but for one specific client. Use this API when using `setMultiClient(true)`.
   * @param {WebUIEvent} e - event.
   * @param {string} script - js code to execute.
   * @param options - response timeout (0 means no timeout), bufferSize,
   * default is `{ timeout: 0, bufferSize: 1024 * 1000 }`.
   * @returns Promise that resolve or reject the client response.
   * @example
   * ```ts
   * setMultiClient(true);
   * myWindow.bind('myBackend', (e: WebUI.Event) => {
   *  const response = await myWindow.scriptClient(e, 'return 6 + 4;').catch(console.error)
   *  // response == "10"
   * });
   * ```
   */
  scriptClient(
    e: WebUIEvent,
    script: string,
    options?: {
      timeout?: number;
      bufferSize?: number;
    },
  ): Promise<string> {
    // Response Buffer
    const bufferSize =
      (options?.bufferSize !== undefined && options.bufferSize > 0)
        ? options.bufferSize
        : 1024 * 1000;
    const buffer = new Uint8Array(bufferSize);
    const timeout = options?.timeout ?? 0;

    // Execute the script
    const status = this.#lib.symbols.webui_interface_script_client(
      BigInt(this.#window),
      BigInt(e.eventNumber),
      toCString(script),
      BigInt(timeout),
      buffer,
      BigInt(bufferSize),
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
      BigInt(this.#window),
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
   * await myWindow.show(
   *  `<html>
   *    <script src="webui.js"></script>
   *    <button id="myBtn">Foo</button>
   *    <button OnClick="myBackend('Test', 123456).then(result => { alert(result) })">Bar</button>
   *  </html>`
   * )
   *
   * async function myBtn(e: WebUI.Event) {
   *   console.log(`${e.element} was clicked`);
   * }
   * myWindow.bind('myBtn', myBtn);
   *
   * myWindow.bind('myBackend', (e: WebUI.Event) => {
   *    const myArg1 = e.arg.string(0); // Test
   *    const myArg2 = e.arg.number(1); // 123456
   *    return "backend response";
   * });
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
        const event_type = typeof param_event_type === "bigint"
          ? Number(param_event_type)
          : Math.trunc(param_event_type);
        const element = param_element !== null
          ? new Deno.UnsafePointerView(param_element).getCString()
          : "";
        const event_number = typeof param_event_number === "bigint"
          ? Number(param_event_number)
          : Math.trunc(param_event_number);
        const _bind_id = typeof param_bind_id === "bigint"
          ? Number(param_bind_id)
          : Math.trunc(param_bind_id);

        // Set get argument methods
        const args = {
          number: (index: number): number => {
            return Number(
              this.#lib.symbols.webui_interface_get_int_at(
                BigInt(win),
                BigInt(event_number),
                BigInt(index),
              ),
            );
          },
          string: (index: number): string => {
            return (
              new Deno.UnsafePointerView(
                this.#lib.symbols.webui_interface_get_string_at(
                  BigInt(win),
                  BigInt(event_number),
                  BigInt(index),
                ) as Deno.PointerObject<unknown>,
              ).getCString()
            ) as string;
          },
          boolean: (index: number): boolean => {
            return this.#lib.symbols.webui_interface_get_bool_at(
              BigInt(win),
              BigInt(event_number),
              BigInt(index),
            ) as boolean;
          },
        };

        // Create struct
        const e: WebUIEvent = {
          window: windows.get(win)!,
          eventType: event_type,
          eventNumber: event_number,
          element: element,
          arg: args,
        };

        // Call the user callback
        const result: string = (await callback(e) as string) ?? "";

        // Send back the response
        this.#lib.symbols.webui_interface_set_response(
          BigInt(this.#window),
          BigInt(event_number),
          toCString(result),
        );
      },
    );
    // Pass the callback pointer to WebUI
    this.#lib.symbols.webui_interface_bind(
      BigInt(this.#window),
      toCString(id),
      callbackResource.pointer,
    );
  }

  /**
   * Sets a custom files handler to respond to HTTP requests.
   *
   * @param handler - Callback that takes an URL, and return a full HTTP header
   * + body. (`string` or `Uint8Array`).
   *
   * @example
   *
   * async function myFileHandler(myUrl: URL) {
   *  if (myUrl.pathname === '/test') {
   *   return "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHello";
   *  }
   * };
   *
   * myWindow.setFileHandler(myFileHandler);
   */
  setFileHandler(callback: (url: URL) => Promise<string | Uint8Array>) {
    // C: .show_wait_connection = false; // 0
    // Disable `.show()` auto waiting for window connection,
    // otherwise `.setFileHandler()` will be blocked.
    _lib.symbols.webui_set_config(BigInt(0), false);

    // C: .use_cookies = false; // 4
    // We need to disable WebUI Cookies because
    // user will use his own custom HTTP header
    // in `.setFileHandler()`.
    _lib.symbols.webui_set_config(BigInt(4), false);

    // Let `.show()` knows that the user is using `.setFileHandler()`
    // so no need to wait for window connection in `.show()`.
    this.#isFileHandler = true;

    // Create the callback
    const callbackResource = new Deno.UnsafeCallback(
      {
        // const void* (*handler)(const char *filename, int *length)
        parameters: ["buffer", "pointer"],
        result: "void",
      } as const,
      async (
        param_url: Deno.PointerValue,
        _param_length: Deno.PointerValue,
      ) => {
        // Get URL as string
        const url_str: string = param_url !== null
          ? new Deno.UnsafePointerView(param_url).getCString()
          : "";

        // Create URL Obj
        const url_obj: URL = new URL(url_str, "http://localhost");

        // Call the user callback
        const user_response: string | Uint8Array = await callback(url_obj);

        // We can pass a local buffer to WebUI like this:
        // `return Deno.UnsafePointer.of(user_response);` However,
        // this may create a memory leak because WebUI cannot free
        // it, or cause memory corruption as Deno may free the buffer
        // before WebUI uses it. Therefore, the solution is to create
        // a safe WebUI buffer through WebUI API. This WebUI buffer will
        // be automatically freed by WebUI later.
        const webui_buffer: Deno.PointerValue = _lib.symbols.webui_malloc(
          BigInt(user_response.length),
        );
        if (!webui_buffer) {
          throw new Error("Failed to allocate memory for WebUI buffer");
        }

        // Copy data to C safe buffer
        if (typeof user_response === "string") {
          // copy `user_response` to `webui_buffer` as String data
          const cString = toCString(user_response);
          const webui_buffer_ref = new Uint8Array(
            Deno.UnsafePointerView.getArrayBuffer(
              webui_buffer,
              cString.byteLength,
            ),
          );
          webui_buffer_ref.set(new Uint8Array(cString));
        } else {
          // copy `user_response` to `webui_buffer` as Uint8Array data
          const webui_buffer_ref = new Uint8Array(
            Deno.UnsafePointerView.getArrayBuffer(
              webui_buffer,
              user_response.byteLength,
            ),
          );
          webui_buffer_ref.set(user_response);
        }

        // Send back the response
        this.#lib.symbols.webui_interface_set_response_file_handler(
          BigInt(this.#window),
          webui_buffer,
          BigInt(user_response.length),
        );
      },
    );
    // Pass the callback pointer to WebUI
    this.#lib.symbols.webui_set_file_handler(
      BigInt(this.#window),
      callbackResource.pointer,
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
  setProfile(name: string, path: string): void {
    return this.#lib.symbols.webui_set_profile(
      BigInt(this.#window),
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
    this.#lib.symbols.webui_set_kiosk(BigInt(this.#window), status);
  }

  /**
   * Close a specific window and free all memory resources.
   */
  destroy(): void {
    this.#lib.symbols.webui_destroy(BigInt(this.#window));
  }

  /**
   * Set the default embedded HTML favicon.
   *
   * @param icon - The icon as string: `<svg>...</svg>`
   * @param iconType - The icon type: `image/svg+xml`
   */
  setIcon(icon: string, iconType: string): void {
    this.#lib.symbols.webui_set_icon(
      BigInt(this.#window),
      toCString(icon),
      toCString(iconType),
    );
  }

  /**
   * Safely send raw data to the UI.
   *
   * @param functionName - The name of the function to send data to.
   * @param raw - The raw data to send.
   */
  sendRaw(functionName: string, raw: Uint8Array<ArrayBuffer>): void {
    this.#lib.symbols.webui_send_raw(
      BigInt(this.#window),
      toCString(functionName),
      raw,
      BigInt(raw.length),
    );
  }

  /**
   * Set a window in hidden mode. Should be called before `.show()`.
   *
   * @param status - True to hide, false to show.
   */
  setHide(status: boolean): void {
    this.#lib.symbols.webui_set_hide(BigInt(this.#window), status);
  }

  /**
   * Set the window size.
   *
   * @param width - The width of the window.
   * @param height - The height of the window.
   */
  setSize(width: number, height: number): void {
    this.#lib.symbols.webui_set_size(BigInt(this.#window), width, height);
  }

  /**
   * Set the window position.
   *
   * @param x - The x-coordinate of the window.
   * @param y - The y-coordinate of the window.
   */
  setPosition(x: number, y: number): void {
    this.#lib.symbols.webui_set_position(BigInt(this.#window), x, y);
  }

  /**
   * Centers the window on the screen. Works better with WebView.
   * Call this function before `show()` for better results.
   *
   * @example
   * ```ts
   * const myWindow = new WebUI();
   * myWindow.setCenter();
   * await myWindow.show("<html>...</html>");
   * ```
   */
  setCenter(): void {
    this.#lib.symbols.webui_set_center(BigInt(this.#window));
  }

  /**
   * Get the full current URL.
   *
   * @return - The current URL.
   */
  getUrl(): string {
    return (
      new Deno.UnsafePointerView(
        this.#lib.symbols.webui_get_url(
          BigInt(this.#window),
        ) as Deno.PointerObject<unknown>,
      ).getCString()
    ) as string;
  }

  /**
   * Allow the window address to be accessible from a public network.
   *
   * @param status - True to allow public access, false to restrict.
   */
  setPublic(status: boolean): void {
    this.#lib.symbols.webui_set_public(BigInt(this.#window), status);
  }

  /**
   * Navigate to a specific URL.
   *
   * @param {string} url - The URL to navigate to.
   * @example
   * ```ts
   * myWindow.navigate("https://webui.me");
   * ```
   */
  navigate(url: string): void {
    this.#lib.symbols.webui_navigate(BigInt(this.#window), toCString(url));
  }

  /**
   * Delete the web-browser local profile folder.
   */
  deleteProfile(): void {
    this.#lib.symbols.webui_delete_profile(BigInt(this.#window));
  }

  /**
   * Get the ID of the parent process (The web browser may re-create
   * another new process).
   *
   * @return - The parent process ID.
   */
  getParentProcessId(): bigint {
    return this.#lib.symbols.webui_get_parent_process_id(BigInt(this.#window));
  }

  /**
   * Get the ID of the last child process.
   *
   * @return - The last child process ID.
   */
  getChildProcessId(): number {
    return Number(
      this.#lib.symbols.webui_get_child_process_id(BigInt(this.#window)),
    );
  }

  /**
   * Get the network port of a running window.
   * This can be useful to determine the HTTP link of `webui.js`
   *
   * @return Returns the network port of the window
   * @example
   * ```ts
   * const port = myWindow.getPort();
   * ```
   */
  getPort(): number {
    return Number(this.#lib.symbols.webui_get_port(BigInt(this.#window)));
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
    return this.#lib.symbols.webui_set_port(BigInt(this.#window), BigInt(port));
  }

  /**
   * Chose between Deno and Nodejs as runtime for .js and .ts files.
   *
   * @param runtime - The runtime value.
   */
  setRuntime(runtime: number): void {
    this.#lib.symbols.webui_set_runtime(BigInt(this.#window), BigInt(runtime));
  }

  /**
   * Get the recommended web browser ID to use. If you are already using one,
   * this function will return the same ID.
   *
   * @return Returns a web browser ID.
   * @example
   * ```ts
   * const browserID = myWindow.getBestBrowser();
   * ```
   */
  getBestBrowser(): number {
    return Number(
      this.#lib.symbols.webui_get_best_browser(BigInt(this.#window)),
    );
  }

  /**
   * Start only the web server and return the URL. No window will be shown.
   *
   * @param {string} content - The HTML, Or a local file
   * @return Returns the url of this window server.
   * @example
   * ```ts
   * const url = myWindow.startServer("/full/root/path");
   * ```
   */
  startServer(content: string): string {
    const url = this.#lib.symbols.webui_start_server(
      BigInt(this.#window),
      toCString(content),
    );
    return Deno.UnsafePointerView.getCString(url!);
  }

  /**
   * Show a WebView window using embedded HTML, or a file. If the window is already
   * open, it will be refreshed. Note: Win32 need `WebView2Loader.dll`.
   *
   * @param {string} content - The HTML, URL, Or a local file
   * @return Returns True if showing the WebView window is successful.
   * @example
   * ```ts
   * await myWindow.showWebView("<html>...</html>");
   * // or
   * await myWindow.showWebView("index.html");
   * ```
   */
  showWebView(content: string): boolean {
    return this.#lib.symbols.webui_show_wv(
      BigInt(this.#window),
      toCString(content),
    );
  }

  /**
   * Add a user-defined web browser's CLI parameters.
   *
   * @param {string} params - Command line parameters
   * @example
   * ```ts
   * myWindow.setCustomParameters("--remote-debugging-port=9222");
   * ```
   */
  setCustomParameters(params: string): void {
    this.#lib.symbols.webui_set_custom_parameters(
      BigInt(this.#window),
      toCString(params),
    );
  }

  /**
   * Set the window with high-contrast support. Useful when you want to
   * build a better high-contrast theme with CSS.
   *
   * @param {boolean} status - True or False
   * @example
   * ```ts
   * myWindow.setHighContrast(true);
   * ```
   */
  setHighContrast(status: boolean): void {
    this.#lib.symbols.webui_set_high_contrast(BigInt(this.#window), status);
  }

  /**
   * Make a WebView window frameless.
   *
   * @param status - The frameless status `true` or `false`
   * @example
   * ```ts
   * myWindow.setFrameless(true);
   * ```
   */
  setFrameless(status: boolean): void {
    this.#lib.symbols.webui_set_frameless(BigInt(this.#window), status);
  }

  /**
   * Make a WebView window transparent.
   *
   * @param status - The transparency status `true` or `false`
   * @example
   * ```ts
   * myWindow.setTransparent(true);
   * ```
   */
  setTransparent(status: boolean): void {
    this.#lib.symbols.webui_set_transparent(BigInt(this.#window), status);
  }

  /**
   * Sets whether the window frame is resizable or fixed.
   * Works only on WebView window.
   *
   * @param status - True or False
   * @example
   * ```ts
   * myWindow.setResizable(true);
   * ```
   */
  setResizable(status: boolean): void {
    this.#lib.symbols.webui_set_resizable(BigInt(this.#window), status);
  }

  /**
   * Set the window minimum size.
   *
   * @param {number} width - The window width
   * @param {number} height - The window height
   * @example
   * ```ts
   * myWindow.setMinimumSize(800, 600);
   * ```
   */
  setMinimumSize(width: number, height: number): void {
    this.#lib.symbols.webui_set_minimum_size(
      BigInt(this.#window),
      width,
      height,
    );
  }

  /**
   * Set the web browser proxy server to use. Need to be called before `show()`.
   *
   * @param {string} proxyServer - The web browser proxy server
   * @example
   * ```ts
   * myWindow.setProxy("http://127.0.0.1:8888");
   * ```
   */
  setProxy(proxyServer: string): void {
    this.#lib.symbols.webui_set_proxy(
      BigInt(this.#window),
      toCString(proxyServer),
    );
  }

  // Static methods

  /**
   * Get OS high contrast preference.
   *
   * @return Returns True if OS is using high contrast theme
   * @example
   * ```ts
   * const hc = WebUI.isHighContrast();
   * ```
   */
  static isHighContrast(): boolean {
    WebUI.init();
    return _lib.symbols.webui_is_high_contrast();
  }

  /**
   * Check if a web browser is installed.
   *
   * @param {WebUI.Browser} browser - The browser to check
   * @return Returns True if the specified browser is available
   * @example
   * ```ts
   * const status = WebUI.browserExist(WebUI.Browser.Chrome);
   * ```
   */
  static browserExist(browser: WebUI.Browser): boolean {
    WebUI.init();
    return _lib.symbols.webui_browser_exist(BigInt(browser));
  }

  /**
   * Set the web-server root folder path for all windows. Should be used
   * before `show()`.
   *
   * @param {string} path - The local folder full path
   * @return Returns True if the path is valid
   * @example
   * ```ts
   * WebUI.setDefaultRootFolder("/home/Foo/Bar/");
   * ```
   */
  static setDefaultRootFolder(path: string): boolean {
    WebUI.init();
    return _lib.symbols.webui_set_default_root_folder(toCString(path));
  }

  /**
   * Set custom browser folder path.
   *
   * @param {string} path - The browser folder path
   * @example
   * ```ts
   * WebUI.setBrowserFolder("/home/Foo/Bar/");
   * ```
   */
  static setBrowserFolder(path: string): void {
    WebUI.init();
    _lib.symbols.webui_set_browser_folder(toCString(path));
  }

  /**
   * Open an URL in the native default web browser.
   *
   * @param {string} url - The URL to open
   * @example
   * ```ts
   * WebUI.openUrl("https://webui.me");
   * ```
   */
  static openUrl(url: string): void {
    WebUI.init();
    _lib.symbols.webui_open_url(toCString(url));
  }

  /**
   * Get an available usable free network port.
   *
   * @return Returns a free port
   * @example
   * ```ts
   * const port = WebUI.getFreePort();
   * ```
   */
  static getFreePort(): number {
    WebUI.init();
    return Number(_lib.symbols.webui_get_free_port());
  }

  /**
   * Automatically refresh the window UI when any file in the root folder gets changed.
   *
   * @param {boolean} status - True to enable monitoring, false to disable
   * @example
   * ```ts
   * WebUI.setFolderMonitor(true);
   * ```
   */
  static setFolderMonitor(status: boolean): void {
    WebUI.init();
    _lib.symbols.webui_set_config(BigInt(2), status);
  }

  // --[ Static Methods ]------------------------

  /**
   * Initialize WebUI library if it's not already initialized.
   */
  private static init() {
    if (typeof _lib === "undefined") {
      _lib = loadLib();
      // C: .asynchronous_response = true; // 5
      // Enable async calls, this is needed for `.bind()`
      _lib.symbols.webui_set_config(BigInt(5), true);
    }
  }

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
    WebUI.init();
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
    WebUI.init();
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
   * @example
   * ```ts
   * const myWindow = new WebUI()
   * await myWindow.show(`<html><script src="webui.js">/script> Your Page... </html>`)
   *
   * await WebUI.wait() // Async wait until all windows are closed
   *
   * // You can show windows again, or call WebUI.clean()
   * ```
   */
  static async wait() {
    WebUI.init();

    // Run WebUI main loop and render the WebView UI
    // _lib.symbols.webui_wait();

    // TODO:
    // We should call `_lib.symbols.webui_wait()` to render the WebView UI,
    // but this blocks the Deno main thread (`callbackResource`), which
    // prevents all WebUI events (clicks, calls, etc.) from being executed.
    //
    // As a workaround, we will use `sleep()` periodically to check if the
    // application is still running. However, this workaround means the
    // WebView will not render — only the browser-based window will function.
    //
    // In the future, we should find a way to use `_lib.symbols.webui_wait()`
    // to render the WebView UI without blocking WebUI events.

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    while (1) {
      await sleep(100);
      if (!_lib.symbols.webui_interface_is_app_running()) {
        break;
      }
    }
  }

  /**
   * Allow multiple clients to connect to the same window.
   *
   * @param allow - True or False.
   */
  static setMultiClient(allow: boolean): void {
    WebUI.init();
    _lib.symbols.webui_set_config(BigInt(3), allow);
  }

  /**
   * Delete all local web-browser profiles folder.
   */
  static deleteAllProfiles(): void {
    WebUI.init();
    _lib.symbols.webui_delete_all_profiles();
  }

  /**
   * Base64 encoding. Use this to safely send text based data to the UI.
   *
   * @param str - The string to encode.
   * @return - The encoded string.
   */
  static encode(str: string): string {
    WebUI.init();
    return (
      new Deno.UnsafePointerView(
        _lib.symbols.webui_encode(toCString(str)) as Deno.PointerObject<
          unknown
        >,
      ).getCString()
    ) as string;
  }

  /**
   * Base64 decoding. Use this to safely decode received Base64 text from the UI.
   *
   * @param str - The string to decode.
   * @return - The decoded string.
   */
  static decode(str: string): string {
    WebUI.init();
    return (
      new Deno.UnsafePointerView(
        _lib.symbols.webui_decode(toCString(str)) as Deno.PointerObject<
          unknown
        >,
      ).getCString()
    ) as string;
  }

  /**
   * Safely allocate memory using the WebUI memory management system.
   *
   * @param size - The size of the memory block to allocate.
   * @return - A pointer to the allocated memory block.
   */
  static malloc(size: number): Deno.PointerValue {
    WebUI.init();
    return _lib.symbols.webui_malloc(BigInt(size));
  }

  /**
   * Safely free a memory block allocated by WebUI.
   *
   * @param ptr - The pointer to the memory block.
   */
  static free(ptr: Deno.PointerValue): void {
    WebUI.init();
    _lib.symbols.webui_free(ptr);
  }

  /**
   * Set the maximum time in seconds to wait for the browser to start.
   *
   * @param second - The timeout duration in seconds.
   */
  static setTimeout(second: number): void {
    WebUI.init();
    _lib.symbols.webui_set_timeout(BigInt(second));
  }

  /**
   * Clean all memory resources. WebUI is not usable after this call.
   */
  static clean() {
    WebUI.init();
    _lib.symbols.webui_clean();
  }

  /**
   * Get the WebUI library version.
   * @returns The version string (e.g., "2.5.5").
   */
  static get version(): string {
    return metadata.version;
  }
}

/**
 * WebUI class containing related types and enums.
 */
// deno-lint-ignore no-namespace
export namespace WebUI {
  /**
   * Type alias for WebUI event objects.
   */
  export type Event = WebUIEvent;
  /**
   * Enum representing the supported web browsers.
   */
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
  /**
   * Enum representing the types of events WebUI can handle.
   */
  export enum EventType {
    Disconnected = 0, // 0. Window disconnection event
    Connected, // 1. Window connection event
    MouseClick, // 2. Mouse click event
    Navigation, // 3. Window navigation event
    Callback, // 4. Function call event
  }
}
