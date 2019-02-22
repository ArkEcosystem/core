import AJV from "ajv";
import ip from "ip";

/**
 * Validate the headers provided.
 * @param  {Object} headers
 * @return {Object<{valid: boolean, errors: Array<Object>}>} Validation object
 */
const validateHeaders = headers => {
    const ajv = new AJV();

    ajv.addFormat("ip", {
        type: "string",
        validate: value => ip.isV4Format(value) || ip.isV6Format(value),
    });

    if (headers.port) {
        headers.port = +headers.port;
    }

    const errors = ajv.validate(
        {
            type: "object",
            properties: {
                ip: {
                    type: "string",
                    format: "ip",
                },
                port: {
                    type: "integer",
                    minimum: 1,
                    maximum: 65535,
                },
                os: {
                    type: "string",
                    maxLength: 64,
                },
                nethash: {
                    type: "string",
                    maxLength: 64,
                },
                version: {
                    type: "string",
                    maxLength: 16,
                },
            },
            required: ["version", "nethash", "port"],
        },
        headers,
    )
        ? null
        : ajv.errors;

    return {
        valid: !errors,
        errors,
    };
};

export { validateHeaders };
