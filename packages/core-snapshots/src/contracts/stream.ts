import { Readable } from "stream";

import { StreamReader, StreamWriter } from "../filesystem";

export type StreamReaderFactory = (file: string, useCompression: boolean, decode: Function) => StreamReader;

export type StreamWriterFactory = (
    dbStream: Readable,
    file: string,
    useCompression: boolean,
    encode: Function,
) => StreamWriter;

type ListenerFunction = (...data) => void;

export interface EventListenerPair {
    event: string;
    listener: ListenerFunction;
}
