export interface Repository {
    getReadStream(): Promise<NodeJS.ReadableStream>;
    save(data: any): Promise<any>;
}
