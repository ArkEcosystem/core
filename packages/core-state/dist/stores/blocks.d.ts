import { Interfaces } from "@arkecosystem/crypto";
export declare class BlockStore {
    private readonly byId;
    private readonly byHeight;
    private lastBlock;
    constructor(maxSize: number);
    get(key: string | number): Interfaces.IBlockData;
    set(value: Interfaces.IBlock): void;
    has(value: Interfaces.IBlockData): boolean;
    delete(value: Interfaces.IBlockData): void;
    clear(): void;
    resize(maxSize: number): void;
    last(): Interfaces.IBlock;
    values(): Interfaces.IBlockData[];
    count(): number;
    getIds(): string[];
    getHeights(): number[];
}
