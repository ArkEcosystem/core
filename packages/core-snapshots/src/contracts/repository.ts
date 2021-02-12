import { Readable } from "stream";

export interface Repository {
    getReadStream(start: number, end: number): Promise<Readable>;
    countInRange(start: number, end: number): Promise<number>;
    save(data: any): Promise<any>;
}

export type RepositoryFactory = (table: string) => Repository;
