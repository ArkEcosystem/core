import { Validation } from "@arkecosystem/crypto";
import Boom from "boom";
import Hapi from "hapi";

const name = "hapi-ajv";

export const hapiAjv = {
    name,
    version: "1.0.0",
    register: async (server: Hapi.Server, options: any): Promise<void> => {
        if (options.registerFormats) {
            options.registerFormats(Validation.validator.getInstance());
        }

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

                if (config.payloadSchema) {
                    const { error } = Validation.validator.validate(config.payloadSchema, request.payload);

                    if (error) {
                        return createErrorResponse(request, h, error);
                    }
                }

                if (config.querySchema) {
                    const { error } = Validation.validator.validate(config.querySchema, request.query);

                    if (error) {
                        return createErrorResponse(request, h, error);
                    }
                }

                return h.continue;
            },
        });
    },
};
