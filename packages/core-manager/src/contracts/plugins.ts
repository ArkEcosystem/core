import { ServerRegisterPluginObject } from "@hapi/hapi";

export interface PluginFactory {
    preparePlugins(): Array<ServerRegisterPluginObject<any>>
}
