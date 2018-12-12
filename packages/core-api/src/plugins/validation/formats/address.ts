import { app } from "@arkecosystem/core-container";
import * as bs58check from "bs58check";

export function registerAddressFormat(ajv) {
    const config = app.resolvePlugin("config");

    ajv.addFormat("address", {
        type: "string",
        validate: value => {
            try {
                return bs58check.decode(value)[0] === config.network.pubKeyHash;
            } catch (e) {
                return false;
            }
        },
    });
}
