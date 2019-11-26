import { CacheStore as CacheStoreContract } from "../contracts/kernel";
import * as Events from "./events";

export * from "type-fest";

export type KeyValuePair<T = any> = Record<string, T>;

export type CacheStore<K, T> = <K, T>() => CacheStoreContract<K, T>;

export { Events };
