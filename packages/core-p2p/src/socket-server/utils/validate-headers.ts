import { validateJSON } from "../../utils";

export const validateHeaders = headers => {
    if (headers.port) {
        headers.port = +headers.port;
    }

    return validateJSON(headers, {
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
    });
};
