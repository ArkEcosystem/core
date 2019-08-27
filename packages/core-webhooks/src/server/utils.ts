import Boom from "@hapi/boom";
import { Webhook } from "../interfaces";

export const transformResource = (model): Webhook => {
    return {
        id: model.id,
        event: model.event,
        target: model.target,
        token: model.token,
        enabled: model.enabled,
        conditions: model.conditions,
    };
};

export const respondWithResource = data => {
    return data ? { data: transformResource(data) } : Boom.notFound();
};
