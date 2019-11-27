import { CacheStore as CacheStoreContract, Pipeline, Queue } from "../contracts/kernel";
import * as Events from "./events";

export * from "type-fest";

export type KeyValuePair<T = any> = Record<string, T>;

export type CacheStore<K, T> = <K, T>() => CacheStoreContract<K, T>;

export type PipelineFactory = () => Pipeline;

export type QueueFactory = () => Queue;

export { Events };
