import { Validation } from "@arkecosystem/crypto";
import ip from "ip";

export const validateJSON = (data, schema) => {
    Validation.validator.addFormat("ip", {
        type: "string",
        validate: value => ip.isV4Format(value) || ip.isV6Format(value),
    });

    return Validation.validator.validate(schema, data);
};
