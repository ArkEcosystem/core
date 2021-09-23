export declare class Config {
    private config;
    setUp(opts: any): Promise<Config>;
    all(): any;
    get<T = any>(key: string, defaultValue?: T): T;
    set<T = any>(key: string, value: T): void;
    getMilestone(height: number): {
        [key: string]: any;
    };
    private configureCrypto;
    private configureNetwork;
}
export declare const configManager: Config;
