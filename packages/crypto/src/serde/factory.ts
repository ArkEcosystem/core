import { IAddress, IReader, IWriter } from "../interfaces";
import { Address } from "./address";
import { Reader } from "./reader";
import { Writer } from "./writer";

export class Factory {
    public static createAddress(serialized: Buffer): IAddress {
        return new Address(serialized);
    }

    public static createReader(buffer: Buffer): IReader {
        return new Reader(buffer);
    }

    public static createWriter(buffer: Buffer): IWriter {
        return new Writer(buffer);
    }
}
