/**
 * # Deno WebUI
 *
 * > Use any web browser as GUI, with Deno in the backend and HTML5 in the
 * > frontend, all in a lightweight Deno module.
 *
 * ## Features
 *
 * - Fully Independent (_No need for any third-party runtimes_)
 * - Lightweight _~900 Kb_ for the whole package & Small memory footprint
 * - Fast binary communication protocol between WebUI and the browser (_Instead of JSON_)
 * - Multi-platform & Multi-Browser
 * - Using private profile for safety
 * - Original library written in Pure C
 *
 * ## Minimal Example
 *
 * ```ts
 * import { WebUI } from "https://deno.land/x/webui@2.5.2/mod.ts";
 *
 * const myWindow = new WebUI();
 * myWindow.show("<html><script src=\"webui.js\"></script> Hello World! </html>");
 * await WebUI.wait();
 * ```
 *
 * @module
 * @license MIT
 */
export { WebUI } from "./src/webui.ts";
