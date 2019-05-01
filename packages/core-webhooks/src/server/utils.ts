import Boom from "@hapi/boom";
import { IWebhook } from "../interfaces";

export const transformResource = (model): IWebhook => {
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
