import { OrderedMap } from "immutable";

export class OrderedCappedMap<K, V> {
    protected store: OrderedMap<K, V> = OrderedMap<K, V>();
    private maxSize: number;

    constructor(maxSize: number) {
        this.resize(maxSize);
    }

    public get(key: K): V {
        return this.store.get(key);
    }

    public set(key: K, value: V): void {
        if (this.store.size >= this.maxSize) {
            this.store = this.store.delete(this.store.keyOf(this.first()));
        }

        this.store = this.store.set(key, value);
    }

    public has(key: K): boolean {
        return this.store.has(key);
    }

    public delete(key: K): boolean {
        if (!this.store.has(key)) {
            return false;
        }

        this.store = this.store.delete(key);

        return !this.store.has(key);
    }

    public clear(): void {
        this.store = this.store.clear();
    }

    public resize(maxSize: number): void {
        this.maxSize = maxSize;

        if (this.store.size > this.maxSize) {
            this.store = this.store.takeLast(this.maxSize);
        }
    }

    public first(): V {
        return this.store.first();
    }

    public last(): V {
        return this.store.last();
    }

    public keys(): K[] {
        return this.store.keySeq().toArray();
    }

    public values(): V[] {
        return this.store.valueSeq().toArray();
    }

    public count(): number {
        return this.store.size;
    }
}
