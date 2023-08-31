import { WebUI } from "../mod.ts";
import { loadLib } from "./lib.ts";

export type Usize = number | bigint;

export type BindCallback<
  T extends JSONValue | undefined | void,
> = (
  event: WebUIEvent,
) => T | Promise<T>;

export interface WebUIEvent {
  window: WebUI;
  eventType: number;
  element: string;
  data: string;
  size: number;
}

export type WebUILib = Awaited<ReturnType<typeof loadLib>>;

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue | undefined }
  | JSONValue[];
