import Hapi from "@hapi/hapi";
import Joi from "@hapi/joi";

type HapiHandler = (request: Hapi.Request, h: Hapi.ResponseToolkit) => any;

export abstract class Route {
    protected static makeRouteConfig(id: string, handler: HapiHandler, schema?: Joi.Schema, maxBytes?: number) {
        return {
            method: "POST",
            path: `/${id.replace(/\./g, "/")}`, // building a valid path from id, we only use the route id anyway
            config: {
                id,
                handler,
                payload: {
                    maxBytes,
                },
            },
        };
    }
}
