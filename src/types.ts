import { loadLib } from "./lib.ts";

export type Usize = number | bigint;

export type BindCallback<
  T extends string | number | boolean | undefined | void,
> = (
  event: Event,
) => T;

export interface Event {
  win: Usize;
  eventType: number;
  element: string;
  data: string;
}

export type WebUiLib = Awaited<ReturnType<typeof loadLib>>;
