import { CacheStore, Pipeline, Queue } from "../contracts/kernel";

export type { Class, JsonObject, PackageJson, Primitive } from "type-fest";

export type KeyValuePair<T = any> = Record<string, T>;

export type ActionArguments = Record<string, any>;

export type CacheFactory<K, T> = <K, T>() => CacheStore<K, T>;

export type PipelineFactory = () => Pipeline;

export type QueueFactory = () => Queue;
