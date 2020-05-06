import * as rpc from "@hapist/json-rpc";
import * as whitelist from "@hapist/whitelist";
import { Plugin, ServerRegisterPluginObject } from "@hapi/hapi";

import { Container, Providers } from "@arkecosystem/core-kernel";
import { Validation } from "@arkecosystem/crypto";

import { Identifiers } from "../ioc";
import { Plugins } from "../contracts";
import { ActionReader } from "../action-reader";
import { rpcResponseHandler } from "./rpc-response-handler";

@Container.injectable()
export class PluginFactory implements Plugins.PluginFactory {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Identifiers.ActionReader)
    private readonly actionReader!: ActionReader;

    public preparePlugins(): Array<ServerRegisterPluginObject<any>> {
        let pluginConfig = this.configuration.get("plugins")

        return [
            {
              plugin: rpcResponseHandler
            },
            {
                plugin: whitelist as unknown as Plugin<any>,
                options: {
                    // @ts-ignore
                    whitelist: pluginConfig.whitelist
                    // whitelist: ["*"],
                    // whitelist: [],
                },
            },
            {
                plugin: rpc as unknown as Plugin<any>,
                options: {
                    methods: this.actionReader.discoverActions(),
                    processor: {
                        schema: {
                            properties: {
                                id: {
                                    type: ["number", "string"],
                                },
                                jsonrpc: {
                                    pattern: "2.0",
                                    type: "string",
                                },
                                method: {
                                    type: "string",
                                },
                                params: {
                                    type: "object",
                                },
                            },
                            required: ["jsonrpc", "method", "id"],
                            type: "object",
                        },
                        validate(data: object, schema: object) {
                            try {
                                const { error } = Validation.validator.validate(schema, data);
                                return { value: data, error: error ? error : null };
                            } catch (error) {
                                return { value: null, error: error.stack };
                            }
                        },
                    },
                },
            }
        ]
    }
}
