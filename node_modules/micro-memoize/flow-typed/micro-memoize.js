declare module 'micro-memoize' {
  declare type Cache = {
    keys: Array<any>,
    size: number,
    values: Array<any>
  };

  declare type Options = {
    isEqual?: (firstValue: any, secondValue: any) => boolean,
    isMatchingKey?: (cacheKey: Array<any>, key: Array<any>) => boolean,
    isPromise?: boolean,
    maxSize?: number,
    onCacheAdd?: (cache: Cache, options: Options) => void,
    onCacheChange?: (cache: Cache, options: Options) => void,
    onCacheHit?: (cache: Cache, options: Options) => void,
    transformKey?: (args: any[]) => any
  };

  declare type Fn = (...args: any[]) => any;

  declare module.exports: {
    (fn: Fn, options?: Options): Fn
  };
}
