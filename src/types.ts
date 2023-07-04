export type Usize = number | bigint;

export type BindCallback<
  T extends string | number | boolean | undefined | void,
> = (
  event: Event,
) => T;

export interface Js {
  timeout: number;
  bufferSize: number;
  response: string;
}

export interface Event {
  win: Usize;
  eventType: number;
  element: string;
  data: string;
}
