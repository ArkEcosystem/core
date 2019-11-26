import { Boom, notFound } from "@hapi/boom";

import { Webhook } from "../interfaces";

/**
 * @param {*} model
 * @returns {Webhook}
 */
export const transformResource = (model): Webhook => ({
    id: model.id,
    event: model.event,
    target: model.target,
    token: model.token,
    enabled: model.enabled,
    conditions: model.conditions,
});

/**
 * @param {*} data
 * @returns {{ data: Webhook }}
 */
export const respondWithResource = (data): { data: Webhook } | Boom<Webhook> =>
    data ? { data: transformResource(data) } : notFound();
