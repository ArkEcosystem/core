import { CacheStore as CacheStoreContract, Pipeline, Queue } from "../contracts/kernel";

export * from "type-fest";

export type KeyValuePair<T = any> = Record<string, T>;

export type ActionArguments = Record<string, any>;

export type CacheStore<K, T> = <K, T>() => CacheStoreContract<K, T>;

export type PipelineFactory = () => Pipeline;

export type QueueFactory = () => Queue;
