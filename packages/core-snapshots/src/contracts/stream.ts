import { StreamReader, StreamWriter } from "@packages/core-snapshots/src/filesystem";

export type StreamReaderFactory = (file: string, decode: Function) => StreamReader;

export type StreamWriterFactory = (dbStream: NodeJS.ReadableStream, file: string, encode: Function) => StreamWriter;
