import { Readable } from "stream";

export class IteratorToStream extends Readable {
    public constructor(private readonly iterator: IterableIterator<any>) {
        super({ objectMode: true });
    }

    public _read(size: number) {
        const item = this.iterator.next();
        this.push(item.done ? null : item.value);
    }
}
