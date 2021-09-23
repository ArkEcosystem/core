declare class Storage {
    private readonly cache;
    constructor();
    read(): any;
    write(data: any): void;
    update(data: any): void;
    get(key: any): any;
}
export declare const storage: Storage;
export {};
