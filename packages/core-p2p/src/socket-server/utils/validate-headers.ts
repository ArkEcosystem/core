import { validateJSON } from "../../utils";

export const validateHeaders = headers => {
    if (headers.port) {
        headers.port = +headers.port;
    }

    if (headers.apiPort) {
        headers.apiPort = +headers.apiPort;
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
            apiPort: {
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
    });
};
