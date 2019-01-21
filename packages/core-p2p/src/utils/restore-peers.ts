import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { existsSync } from "fs";
import Joi from "joi";
import { config } from "../config";

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

export const restorePeers = (): void => {
    const path = `${process.env.CORE_PATH_CACHE}/peers.json`;
    if (existsSync(path)) {
        const peers = require(path);
        const { value, error } = Joi.validate(peers, schema);

        if (error) {
            const logger = app.resolvePlugin<Logger.ILogger>("logger");
            if (logger) {
                logger.warn("Ignoring corrupt peers from cache.");
            }
            return;
        }

        config.set("peers", value);
    }
};
