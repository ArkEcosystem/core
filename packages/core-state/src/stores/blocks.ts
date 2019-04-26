import { OrderedCappedMap } from "@arkecosystem/core-utils";
import { Interfaces } from "@arkecosystem/crypto";
import assert from "assert";

export class BlockStore {
    private readonly byId: OrderedCappedMap<string, Interfaces.IBlockData>;
    private readonly byHeight: OrderedCappedMap<number, Interfaces.IBlockData>;
    private lastBlock: Interfaces.IBlock;

    public constructor(maxSize: number) {
        this.byId = new OrderedCappedMap<string, Interfaces.IBlockData>(maxSize);
        this.byHeight = new OrderedCappedMap<number, Interfaces.IBlockData>(maxSize);
    }

    public get(key: string | number): Interfaces.IBlockData {
        return typeof key === "string" ? this.byId.get(key) : this.byHeight.get(key);
    }

    public set(value: Interfaces.IBlock): void {
        const lastBlock: Interfaces.IBlock = this.last();

        assert.strictEqual(value.data.height, lastBlock ? lastBlock.data.height + 1 : 1);

        this.byId.set(value.data.id, value.data);
        this.byHeight.set(value.data.height, value.data);
        this.lastBlock = value;
    }

    public has(value: Interfaces.IBlockData): boolean {
        return this.byId.has(value.id) || this.byHeight.has(value.height);
    }

    public delete(value: Interfaces.IBlockData): void {
        this.byId.delete(value.id);
        this.byHeight.delete(value.height);
    }

    public clear(): void {
        this.byId.clear();
        this.byHeight.clear();
    }

    public resize(maxSize: number): void {
        this.byId.resize(maxSize);
        this.byHeight.resize(maxSize);
    }

    public last(): Interfaces.IBlock {
        return this.lastBlock;
    }

    public values(): Interfaces.IBlockData[] {
        return this.byId.values();
    }

    public count(): number {
        return this.byId.count();
    }

    public getIds(): string[] {
        return this.byId.keys();
    }

    public getHeights(): number[] {
        return this.byHeight.keys();
    }
}
