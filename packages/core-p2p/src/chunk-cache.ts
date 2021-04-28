import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

interface ChunkData {
    key: string;
    data: Interfaces.IBlockData[];
}

@Container.injectable()
export class ChunkCache implements Contracts.P2P.ChunkCache {
    /**
     * If downloading some chunk fails but nevertheless we manage to download higher chunks,
     * then they are stored here for later retrieval.
     */
    private downloadedChunksCache: ChunkData[] = [];

    /**
     * Maximum number of entries to keep in `downloadedChunksCache`.
     * At 400 blocks per chunk, 100 chunks would amount to 40k blocks.
     * Chunks are removed by First in first out method.
     */
    private downloadedChunksCacheMax: number = 100;

    public has(key: string): boolean {
        return this.downloadedChunksCache.some((chunkData) => chunkData.key === key);
    }

    public get(key: string): Interfaces.IBlockData[] {
        const chunkData = this.downloadedChunksCache.find((chunkData) => chunkData.key === key);

        if (!chunkData) {
            throw new Error(`Downloaded chunk for key ${key} is not defined.`);
        }

        return chunkData.data;
    }

    public set(key: string, data: Interfaces.IBlockData[]): void {
        this.downloadedChunksCache.push({
            key: key,
            data: data,
        });

        if (this.downloadedChunksCache.length > this.downloadedChunksCacheMax) {
            this.downloadedChunksCache.shift();
        }
    }

    public remove(key: string): void {
        this.downloadedChunksCache = this.downloadedChunksCache.filter((chunkData) => chunkData.key !== key);
    }
}
