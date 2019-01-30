import { app } from "@arkecosystem/core-kernel";
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

    const peers = JSON.parse(readFileSync(path, { encoding: "utf8" }));
    const { value, error } = Joi.validate(peers, schema);

    if (error) {
        app.logger.warn("Ignoring corrupt peers from cache.");
        return [];
    }

    return value;
};
