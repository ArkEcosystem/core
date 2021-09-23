declare class ConfigManager {
    private config;
    private file;
    setup(config: Record<string, any>): void;
    get(key: string): string;
    set(key: string, value: string): void;
    update(data: Record<string, string>): void;
    private ensureDefaults;
    private read;
    private write;
}
export declare const configManager: ConfigManager;
export {};
