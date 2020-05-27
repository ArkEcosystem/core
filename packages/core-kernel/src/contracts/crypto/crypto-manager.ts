export interface CryptoManager {
    Identities: any;
    LibraryManager: any;
    HeightTracker: any;
    NetworkConfigManager: any;
    MilestoneManager: any;
    createFromConfig(config: any, libraries?: any): any;
    createFromPreset(name: any, libraries?: any): any;
    getPresets(): any;
    findNetworkByName(name: any): any;
}
