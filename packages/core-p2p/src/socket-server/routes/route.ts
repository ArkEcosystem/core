import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";
import Boom from "@hapi/boom";

type HapiHandler = (request: Hapi.Request, h: Hapi.ResponseToolkit) => any;

export abstract class Route {
    protected static makeRouteObject(
        id: string,
        handler: HapiHandler,
        schema?: Joi.Schema,
        maxBytes?: number
    ) {
        return {
            method: 'POST',
            path: `/${id.replace(/\./g, "/")}`, // building a valid path from id, we only use the route id anyway
            config: {
                id,
                handler: this.wrapHandler(handler, schema),
                payload: {
                    maxBytes
                }
            },
        };
    }

    protected static wrapHandler(handler: HapiHandler, schema?: Joi.Schema) {
        if (schema) {
            return (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
                const { error } = schema.validate(request.payload);
                if (error) {
                    return Boom.badRequest("Validation failed");
                }
                return handler(request, h);
            }
        }
        return handler;
    }
}