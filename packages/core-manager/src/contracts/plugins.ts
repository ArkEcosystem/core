export interface RegisterPluginObject {
    plugin: any,
    options?: any
}

export interface PluginFactory {
    preparePlugins(): Array<RegisterPluginObject>
}
