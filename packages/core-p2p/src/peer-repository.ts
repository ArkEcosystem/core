import { Contracts } from "@arkecosystem/core-kernel";

export class PeerRepository<T> implements Contracts.P2P.PeerRepository<T> {
    private readonly repository: Map<string, T> = new Map<string, T>();

    public all(): Map<string, T> {
        return this.repository;
    }

    public entries(): Array<[string, T]> {
        return [...this.repository.entries()];
    }

    public keys(): string[] {
        return [...this.repository.keys()];
    }

    public values(): T[] {
        return [...this.repository.values()];
    }

    public pull(key: string): T {
        const item = this.repository.get(key);

        this.forget(key);

        return item;
    }

    public get(key: string): T {
        return this.repository.get(key);
    }

    public set(key: string, value: T): void {
        this.repository.set(key, value);
    }

    public forget(key: string): void {
        this.repository.delete(key);
    }

    public flush(): void {
        this.repository.clear();
    }

    public has(key: string): boolean {
        return !!this.get(key);
    }

    public missing(key: string): boolean {
        return !this.has(key);
    }

    public count(): number {
        return this.repository.size;
    }

    public isEmpty(): boolean {
        return this.repository.size <= 0;
    }

    public isNotEmpty(): boolean {
        return !this.isEmpty();
    }

    public random(): T {
        return this.repository.get(this.keys()[Math.floor(Math.random() * this.count())]);
    }

    public toJson(): string {
        const items: Record<string, T> = {};

        for (const [key, value] of this.repository.entries()) {
            items[key] = value;
        }

        return JSON.stringify(items);
    }
}
