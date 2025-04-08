import type { WebUI } from "../mod.ts";
import type { loadLib } from "./lib.ts";

export type Usize = number | bigint;

/**
 * Defines the signature for callback functions used with `WebUI.prototype.bind`.
 * These functions are executed when a corresponding event occurs in the UI.
 *
 * @template T The expected return type of the callback function. Can be a basic data type (`string`, `number`, `boolean`), `undefined`, or `void`. Can also be a Promise resolving to one of these types for asynchronous operations.
 * @param event A `WebUIEvent` object containing details about the event.
 * @returns The result to be sent back to the UI (if the call originated from `webui.call`), or `undefined`/`void` if no response is needed. Can be a direct value or a Promise.
 */
export type BindCallback<
  T extends Datatypes | undefined | void,
> = (event: WebUIEvent) => T | Promise<T>;

export type WebUILib = Awaited<ReturnType<typeof loadLib>>;

/**
 * Represents an event object passed to bound callback functions.
 */
export interface WebUIEvent {
  /** The WebUI window instance associated with this event. */
  window: WebUI;
  /** The type of the event (e.g., Connected, Disconnected, MouseClick, Callback). See `WebUI.EventType`. */
  eventType: number;
  /** A unique identifier for this specific event instance. */
  eventNumber: number;
  /** The ID ('#' attribute) of the HTML element that triggered the event, if applicable. */
  element: string;
  /**
   * An object containing methods to retrieve arguments passed from the UI JavaScript function call.
   */
  arg: {
    /**
     * Retrieves a numeric argument passed from the UI at the specified index.
     * @param index The zero-based index of the argument.
     * @returns The numeric value of the argument.
     */
    number: (index: number) => number;
    /**
     * Retrieves a string argument passed from the UI at the specified index.
     * @param index The zero-based index of the argument.
     * @returns The string value of the argument.
     */
    string: (index: number) => string;
    /**
     * Retrieves a boolean argument passed from the UI at the specified index.
     * @param index The zero-based index of the argument.
     * @returns The boolean value of the argument.
     */
    boolean: (index: number) => boolean;
  };
}

/**
 * Represents the basic data types that can be returned from a `BindCallback`
 * function and serialized back to the UI.
 */
export type Datatypes =
  | string
  | number
  | boolean;
