/**
 * # WebUI
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
 * ## Installation
 * `import { webui } from "https://deno.land/x/webui/mod.ts";`
 *
 * ## Minimal Example
 *
 * ```ts
 * import { webui } from "https://deno.land/x/webui/mod.ts";
 *
 * const myWindow = new WebUi();
 * webui.show("<html>Hello World</html>");
 * WebUi.wait();
 * ```
 *
 * @module
 * @license MIT
 */
export { WebUi } from "./src/webui.ts";
export type { WebUiEvent } from "./src/types.ts";
