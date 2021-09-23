import { ClientOptions } from "@elastic/elasticsearch";
declare class Client {
    private client;
    setUp(options: ClientOptions): Promise<void>;
    bulk(body: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    count(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    search(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    create(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    update(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    delete(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
    exists(params: any): Promise<import("@elastic/elasticsearch").ApiResponse<any, any>>;
}
export declare const client: Client;
export {};
