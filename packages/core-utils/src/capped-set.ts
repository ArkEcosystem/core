/**
 * A Set that is capped in size and acts like a FIFO.
 */
export class CappedSet {
    private data: Set<any>;
    private maxSize: number;

    constructor(maxSize: number = 16384) {
        this.maxSize = maxSize;
        this.data = new Set();
    }

    public add(newElement: any): void {
        if (this.data.size >= this.maxSize) {
            const oldest = this.data.values().next().value;
            this.data.delete(oldest);
        }
        this.data.add(newElement);
    }

    public has(element: any): boolean {
        return this.data.has(element);
    }
}
