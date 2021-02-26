import { Interfaces } from "@arkecosystem/crypto";

export interface BlockStore {
    get(key: string | number): Interfaces.IBlockData | undefined;

    set(value: Interfaces.IBlock): void;

    has(value: Interfaces.IBlockData): boolean;

    delete(value: Interfaces.IBlockData): void;

    clear(): void;

    resize(maxSize: number): void;

    last(): Interfaces.IBlock | undefined;

    values(): Interfaces.IBlockData[];

    count(): number;

    getIds(): string[];

    getHeights(): number[];
}
