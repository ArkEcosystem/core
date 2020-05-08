import { Container, Providers, Utils } from "@arkecosystem/core-kernel";
import { Authentication } from "../contracts";
import argon2 from "argon2";

@Container.injectable()
export class Argon2id implements Authentication.BasicCredentialsValidator {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    public async validate(username: string, password: string): Promise<boolean> {
        try {
            const pluginsConfiguration = this.configuration.get("plugins") as any;

            // @ts-ignore
            const secret = pluginsConfiguration.basicAuthentication.secret as string;
            Utils.assert.defined<string>(secret);

            const users = pluginsConfiguration.basicAuthentication.users as {username: string, password: string}[];
            Utils.assert.array(users);

            let user = users.find(x => x.username === username);
            Utils.assert.defined(user);

            let options = {
                secret: Buffer.from(secret),
                type: argon2.argon2id
            }

            return await argon2.verify(user!.password, password, options);
        } catch { }

        return false;
    }
}
