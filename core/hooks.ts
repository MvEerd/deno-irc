// deno-lint-ignore-file ban-types no-explicit-any
type AsyncReturnType<T extends () => unknown> = ReturnType<T> extends
  PromiseLike<infer U> ? U : ReturnType<T>;

export class Hooks<T extends Record<PropertyKey, any>> {
  constructor(private target: T) {}

  /** Hooks before calling method.
   *
   * The hook function takes all parameters of the method. */
  beforeCall<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    this.hookCall(key, (fn, ...args) => {
      hook(...args);
      return fn(...args as unknown[]);
    });
  }

  /** Hooks after calling method.
   *
   * The hook function takes the resolved return value of the method. */
  afterCall<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (value: AsyncReturnType<F>) => void,
  >(key: K, hook: H): void {
    this.hookCall(key, async (fn, ...args) => {
      const value = await fn(...args as unknown[]);
      hook(value);
      return value;
    });
  }

  /** Hooks before mutating object. */
  beforeMutate<
    K extends { [K in keyof T]: T[K] extends Function ? never : K }[keyof T],
    H extends (obj: T[K], key: keyof T[K], value: T[K][keyof T[K]]) => void,
  >(key: K, hook: H): void {
    this.target[key] = new Proxy(this.target[key], {
      set: (obj, key, value) => {
        hook(obj, key, value);
        obj[key] = value;
        return true;
      },
    });
  }

  private hookCall<
    K extends { [K in keyof T]: T[K] extends Function ? K : never }[keyof T],
    F extends T[K] extends Function ? T[K] : never,
    H extends (fn: F, ...args: Parameters<F>) => void,
  >(key: K, hook: H): void {
    const fn = this.target[key].bind(this.target);
    (this.target as any)[key] = (...args: Parameters<F>) => hook(fn, ...args);
  }
}
