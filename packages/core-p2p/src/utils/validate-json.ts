import { Validation } from "@arkecosystem/core-crypto";
import ip from "ip";

// todo: review the implementation
export const validateJSON = (data, schema, validator: Validation.Validator) => {
    validator.addFormat("ip", {
        type: "string",
        validate: (value) => ip.isV4Format(value) || ip.isV6Format(value),
    });

    return validator.validate(schema, data);
};
