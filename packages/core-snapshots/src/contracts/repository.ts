export interface Repository {
    getReadStream(start: number, end: number): Promise<NodeJS.ReadableStream>;
    countInRange(start: number, end: number): Promise<number>;
    save(data: any): Promise<any>;
}
