export interface RegisterPluginObject {
    plugin: any;
    options?: any;
}

export interface PluginFactoryOptions {
    jsonRpcEnabled: boolean;
}

export interface PluginFactory {
    preparePlugins(options: PluginFactoryOptions): Array<RegisterPluginObject>;
}
