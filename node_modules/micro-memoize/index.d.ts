interface Cache {
  keys: Array<any>;
  size: number;
  values: Array<any>;
}

interface Options {
  isEqual?: (firstValue: any, secondValue: any) => boolean;
  isMatchingKey?: (cacheKey: Array<any>, key: Array<any>) => boolean;
  isPromise?: boolean;
  maxSize?: number;
  onCacheAdd?: (cache: Cache, options: Options, memoized: Function) => void;
  onCacheChange?: (cache: Cache, options: Options, memoized: Function) => void;
  onCacheHit?: (cache: Cache, options: Options, memoized: Function) => void;
  transformKey?: (args: any[]) => any;
}

type Fn = (...args: any[]) => any;

export default function memoize<T extends Fn>(fn: T, options?: Options): T;
