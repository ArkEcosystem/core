import { Container, Providers } from "@arkecosystem/core-kernel";
import { Validation } from "@arkecosystem/crypto";
import * as basicAuthenticationPlugin from "@hapi/basic";
import { Server as HapiServer } from "@hapi/hapi";
import * as rpc from "@hapist/json-rpc";
import * as whitelist from "@hapist/whitelist";
import * as tokenAuthenticationPlugin from "hapi-auth-bearer-token";

import { ActionReader } from "../../action-reader";
import { Authentication, Plugins } from "../../contracts";
import { Identifiers } from "../../ioc";
import { rpcResponseHandler } from "./rpc-response-handler";

@Container.injectable()
export class PluginFactory implements Plugins.PluginFactory {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Identifiers.ActionReader)
    private readonly actionReader!: ActionReader;

    @Container.inject(Identifiers.BasicCredentialsValidator)
    private readonly basicCredentialsValidator!: Authentication.BasicCredentialsValidator;

    @Container.inject(Identifiers.TokenValidator)
    private readonly tokenValidator!: Authentication.TokenValidator;

    public preparePlugins(options: Plugins.PluginFactoryOptions): Array<Plugins.RegisterPluginObject> {
        const pluginConfig = this.configuration.get("plugins");

        const plugins: Plugins.RegisterPluginObject[] = [
            {
                plugin: whitelist,
                options: {
                    // @ts-ignore
                    whitelist: pluginConfig.whitelist,
                },
            },
        ];

        if (options.jsonRpcEnabled) {
            plugins.push(this.prepareJsonRpc());
            plugins.push(this.prepareJsonRpcResponseHandler());
        }

        // @ts-ignore
        if (pluginConfig.basicAuthentication.enabled) {
            plugins.push(this.prepareBasicAuthentication());
        }

        // @ts-ignore
        if (pluginConfig.tokenAuthentication.enabled) {
            plugins.push(this.prepareTokenAuthentication());
        }

        return plugins;
    }

    private prepareJsonRpc(): Plugins.RegisterPluginObject {
        return {
            plugin: rpc,
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
        };
    }

    private prepareJsonRpcResponseHandler(): Plugins.RegisterPluginObject {
        return {
            plugin: rpcResponseHandler,
        };
    }

    private prepareBasicAuthentication(): Plugins.RegisterPluginObject {
        return {
            plugin: {
                name: "basicAuthentication",
                version: "0.1.0",
                register: async (server: HapiServer) => {
                    await server.register(basicAuthenticationPlugin);

                    server.auth.strategy("simple", "basic", {
                        validate: async (...params) => {
                            // @ts-ignore
                            return this.validateBasicCredentials(...params);
                        },
                    });
                    server.auth.default("simple");
                },
            },
        };
    }

    private async validateBasicCredentials(request, username, password, h) {
        const isValid = await this.basicCredentialsValidator.validate(username, password);

        return { isValid: isValid, credentials: { name: username } };
    }

    private prepareTokenAuthentication(): Plugins.RegisterPluginObject {
        return {
            plugin: {
                name: "tokenAuthentication",
                version: "0.1.0",
                register: async (server: HapiServer) => {
                    await server.register(tokenAuthenticationPlugin);

                    server.auth.strategy("simple", "bearer-access-token", {
                        allowQueryToken: true,
                        accessTokenName: "token",
                        validate: async (...params) => {
                            // @ts-ignore
                            return this.validateToken(...params);
                        },
                    });

                    server.auth.default("simple");
                },
            },
        };
    }

    private async validateToken(request, token, h) {
        const isValid = await this.tokenValidator.validate(token);

        return { isValid: isValid, credentials: { token } };
    }
}
