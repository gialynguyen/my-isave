export type DateToString<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<DateToString<U>>
    : T extends object
      ? { [K in keyof T]: DateToString<T[K]> }
      : T;

export type JSONSerialized<T> = DateToString<T>;
