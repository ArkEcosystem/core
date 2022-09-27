import { MempoolIndex } from "./mempool-index";

export interface MempoolIndexRegistry {
    get(indexName: string): MempoolIndex;
    clear(): void;
}
