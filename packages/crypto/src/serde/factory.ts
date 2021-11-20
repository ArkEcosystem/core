import { IReader, IWriter } from "../interfaces";
import { Reader } from "./reader";
import { Writer } from "./writer";

export class SerdeFactory {
    public static createReader(buffer: Buffer): IReader {
        return new Reader(buffer);
    }

    public static createWriter(buffer: Buffer): IWriter {
        return new Writer(buffer);
    }
}
