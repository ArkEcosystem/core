import { OrderedCappedMap } from "@arkecosystem/core-utils";

export abstract class AbstractStore<K, V> {
    protected readonly store: OrderedCappedMap<K, V>;

    public constructor(maxSize: number) {
        this.store = new OrderedCappedMap<K, V>(maxSize);
    }

    public get(key: K): V {
        return this.store.get(key);
    }

    public abstract set(value: V): void;

    public has(key: K): boolean {
        return this.store.has(key);
    }

    public delete(key: K): boolean {
        return this.store.delete(key);
    }

    public clear(): void {
        this.store.clear();
    }

    public resize(maxSize: number): void {
        this.store.resize(maxSize);
    }

    public first(): V {
        return this.store.first();
    }

    public last(): V {
        return this.store.last();
    }

    public keys(): K[] {
        return this.store.keys();
    }

    public values(): V[] {
        return this.store.values();
    }

    public count(): number {
        return this.store.count();
    }
}
