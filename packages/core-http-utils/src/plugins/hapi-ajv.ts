import { AjvWrapper } from "@arkecosystem/crypto";
import Boom from "boom";
import Hapi from "hapi";

const name = "hapi-ajv";

export const hapiAjv = {
    name,
    version: "1.0.0",
    register: async (server: Hapi.Server, options: any): Promise<void> => {
        const ajv = AjvWrapper.instance();

        if (options.registerFormats) {
            options.registerFormats(ajv);
        }

        const validate = (schema, data) => {
            return ajv.validate(schema, data) ? null : ajv.errors;
        };

        const createErrorResponse = (request, h, errors) => {
            if (request.pre.apiVersion === 1) {
                return h
                    .response({
                        path: errors[0].dataPath,
                        error: errors[0].message,
                        success: false,
                    })
                    .takeover();
            }

            return Boom.badData(errors);
        };

        server.ext({
            type: "onPreHandler",
            method: (request, h) => {
                const config = request.route.settings.plugins[name] || {};

                let errors;

                if (config.payloadSchema) {
                    errors = validate(config.payloadSchema, request.payload);

                    if (errors) {
                        return createErrorResponse(request, h, errors[0].message);
                    }
                }

                if (config.querySchema) {
                    errors = validate(config.querySchema, request.query);

                    if (errors) {
                        return createErrorResponse(request, h, errors);
                    }
                }

                return h.continue;
            },
        });
    },
};
