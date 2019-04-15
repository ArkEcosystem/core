import Boom from "boom";
import { IWebhook } from "../interfaces";

export function transformResource(model): IWebhook {
    return {
        id: model.id,
        event: model.event,
        target: model.target,
        token: model.token,
        enabled: model.enabled,
        conditions: model.conditions,
    };
}

export function respondWithResource(data) {
    return data ? { data: transformResource(data) } : Boom.notFound();
}
