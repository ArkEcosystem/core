import { app } from "@arkecosystem/core-kernel";
import * as bs58check from "bs58check";

export function registerAddressFormat(ajv) {
    const config = app.getConfig();

    ajv.addFormat("address", {
        type: "string",
        validate: value => {
            try {
                return bs58check.decode(value)[0] === config.get("network.pubKeyHash");
            } catch (e) {
                return false;
            }
        },
    });
}
