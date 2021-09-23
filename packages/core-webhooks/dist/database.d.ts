import { IWebhook } from "./interfaces";
declare class Database {
    private database;
    make(): void;
    all(): IWebhook[];
    hasById(id: string): boolean;
    findById(id: string): IWebhook;
    findByEvent(event: string): IWebhook[];
    create(data: IWebhook): IWebhook;
    update(id: string, data: IWebhook): IWebhook;
    destroy(id: string): void;
    reset(): void;
}
export declare const database: Database;
export {};
