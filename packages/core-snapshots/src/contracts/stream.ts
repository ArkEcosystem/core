import { StreamReader, StreamWriter } from "@packages/core-snapshots/src/filesystem";

export type StreamReaderFactory = (file: string, useCompression: boolean, decode: Function) => StreamReader;

export type StreamWriterFactory = (dbStream: NodeJS.ReadableStream, file: string, useCompression: boolean, encode: Function) => StreamWriter;
