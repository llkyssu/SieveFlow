// Common utility types

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
