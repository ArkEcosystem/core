import { INetworkConfig } from "../interfaces/networks";
import { NetworkName } from "../types";
export declare class ConfigManager {
    private config;
    private height;
    private milestone;
    private milestones;
    constructor();
    setConfig(config: INetworkConfig): void;
    setFromPreset(network: NetworkName): void;
    getPreset(network: NetworkName): INetworkConfig;
    all(): INetworkConfig;
    set<T = any>(key: string, value: T): void;
    get<T = any>(key: string): T;
    setHeight(value: number): void;
    getHeight(): number;
    isNewMilestone(height?: number): boolean;
    getMilestone(height?: number): {
        [key: string]: any;
    };
    getMilestones(): any;
    private buildConstants;
    private validateMilestones;
}
export declare const configManager: ConfigManager;
