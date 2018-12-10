import { randomBytes } from "crypto";
import { database } from "../database";
import * as schema from "./schema";
import * as utils from "./utils";

/**
 * @type {Object}
 */
const index = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const webhooks = await database.paginate(utils.paginate(request));

        return utils.toPagination(request, webhooks);
    },
};

/**
 * @type {Object}
 */
const store = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const token = randomBytes(32).toString("hex");

        request.payload.token = token.substring(0, 32);

        const webhook = await database.create(request.payload);
        webhook.token = token;

        return h.response(utils.respondWithResource(request, webhook)).code(201);
    },
    options: {
        plugins: {
            pagination: {
                enabled: false,
            },
        },
        validate: schema.store,
    },
};

/**
 * @type {Object}
 */
const show = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const webhook = await database.findById(request.params.id);
        delete webhook.token;

        return utils.respondWithResource(request, webhook);
    },
    options: {
        validate: schema.show,
    },
};

/**
 * @type {Object}
 */
const update = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        await database.update(request.params.id, request.payload);

        return h.response(null).code(204);
    },
    options: {
        validate: schema.update,
    },
};

/**
 * @type {Object}
 */
const destroy = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        await database.destroy(request.params.id);

        return h.response(null).code(204);
    },
    options: {
        validate: schema.destroy,
    },
};

export { index, store, show, update, destroy };
