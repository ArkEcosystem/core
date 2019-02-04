import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { existsSync, readFileSync } from "fs";
import Joi from "joi";

const schema = Joi.array().items(
    Joi.object().keys({
        ip: Joi.string()
            .ip()
            .required(),
        port: Joi.number()
            .port()
            .required(),
        version: Joi.string().required(),
    }),
);

export const restorePeers = (): any[] => {
    const path = `${process.env.CORE_PATH_CACHE}/peers.json`;
    if (!existsSync(path)) {
        return [];
    }

    try {
        const peers = JSON.parse(readFileSync(path, { encoding: "utf8" }));
        const { value, error } = Joi.validate(peers, schema);

        if (error) {
            const logger = app.resolvePlugin<Logger.ILogger>("logger");
            if (logger) {
                logger.warn("Ignoring corrupt peers from cache.");
            }
            return [];
        }

        return value;
    } catch (error) {
        return [];
    }
};
