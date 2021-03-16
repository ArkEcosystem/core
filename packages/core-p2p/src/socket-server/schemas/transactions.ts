import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import Joi from "joi";

import { headers } from "./shared";

export const transactionsSchemas = {
    createPostTransactionsSchema: (app: Contracts.Kernel.Application): Joi.AnySchema =>
        Joi.object({
            transactions: Joi.array()
                .items(Joi.binary())
                .max(
                    app
                        .getTagged<Providers.PluginConfiguration>(
                            Container.Identifiers.PluginConfiguration,
                            "plugin",
                            "@arkecosystem/core-transaction-pool",
                        )
                        .getOptional<number>("maxTransactionsPerRequest", 40),
                ),
            headers,
        }),
};
