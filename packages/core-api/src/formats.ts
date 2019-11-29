import { app } from "@arkecosystem/core-container";
import { Utils } from "@arkecosystem/crypto";
import { Ajv } from "ajv";
import * as ipAddress from "ip";

export const registerFormats = (ajv: Ajv) => {
    const config = app.getConfig();

    ajv.addFormat("address", {
        type: "string",
        validate: value => {
            try {
                return Utils.Base58.decodeCheck(value)[0] === config.get("network.pubKeyHash");
            } catch (e) {
                return false;
            }
        },
    });

    ajv.addFormat("csv", {
        type: "string",
        validate: value => {
            try {
                const a = value.split(",");

                return a.length > 0 && a.length <= 1000;
            } catch (e) {
                return false;
            }
        },
    });

    ajv.addFormat("hex", {
        type: "string",
        validate: value => value.match(/^[0-9a-f]+$/i) !== null && value.length % 2 === 0,
    });

    ajv.addFormat("ip", {
        type: "string",
        validate: value => ipAddress.isV4Format(value) || ipAddress.isV6Format(value),
    });

    ajv.addFormat("parsedInt", {
        type: "string",
        validate: (value: any) => {
            if (isNaN(value) || parseInt(value, 10) !== value || isNaN(parseInt(value, 10))) {
                return false;
            }

            value = parseInt(value, 10);

            return true;
        },
    });

    ajv.addFormat("publicKey", {
        type: "string",
        validate: value => {
            try {
                return Buffer.from(value, "hex").length === 33;
            } catch (e) {
                return false;
            }
        },
    });

    ajv.addFormat("signature", {
        type: "string",
        validate: value => {
            try {
                return Buffer.from(value, "hex").length < 73;
            } catch (e) {
                return false;
            }
        },
    });
};
