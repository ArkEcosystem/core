import Joi from "joi";

export function validate(data: object) {
    return Joi.validate(
        data,
        {
            data: Joi.string().default("~/.ark"),
            config: Joi.string().default("~/.ark/config"),
            network: Joi.string()
                .valid(["mainnet", "devnet", "testnet"])
                .required(),
            remote: Joi.string()
                .uri()
                .optional(),
            forgerBip38: Joi.string().optional(),
            forgerBip39: Joi.string().optional(),
            networkStart: Joi.boolean().default(false),
            disableDiscovery: Joi.boolean().default(false),
            skipDiscovery: Joi.boolean().default(false),
            ignoreMinimumNetworkReach: Joi.boolean().default(false),
            launchMode: Joi.string()
                .valid(["seed"])
                .optional(),
            preset: Joi.string()
                .valid(["forger", "full", "relay-api", "relay-forger", "relay-minimal", "relay-rpc", "relay-webhooks"])
                .optional(),
            interactive: Joi.boolean().default(true),
            parent: Joi.object({ _version: Joi.string() }),
        },
        { stripUnknown: true },
    );
}
