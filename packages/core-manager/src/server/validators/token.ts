import { Container, Providers } from "@arkecosystem/core-kernel";

import { Authentication } from "../../contracts";

@Container.injectable()
export class SimpleTokenValidator implements Authentication.TokenValidator {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    public async validate(token: string): Promise<boolean> {
        const pluginsConfiguration = this.configuration.get("plugins");

        // @ts-ignore
        return token === pluginsConfiguration?.tokenAuthentication?.token;
    }
}
