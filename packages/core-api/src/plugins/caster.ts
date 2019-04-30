import { Utils } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

function isBoolean(value) {
    try {
        return value.toLowerCase() === "true" || value.toLowerCase() === "false";
    } catch (e) {
        return false;
    }
}

function isNumber(value) {
    return !isNaN(value);
}

export = {
    name: "core-caster",
    version: "1.0.0",
    async register(server: Hapi.Server): Promise<void> {
        server.ext({
            type: "onPreHandler",
            method: (request, h) => {
                const query = request.query;

                Object.keys(query).map((key, index) => {
                    // Special fields that should always be a "string"
                    if (key === "id" || key === "blockId" || key === "previousBlock") {
                        query[key] = query[key];
                    } else if (isBoolean(query[key])) {
                        // @ts-ignore
                        query[key] = query[key].toLowerCase() === "true";
                    } else if (isNumber(query[key])) {
                        // @ts-ignore
                        // tslint:disable-next-line triple-equals
                        if (query[key] == Number(query[key])) {
                            // @ts-ignore
                            query[key] = Number(query[key]);
                        } else {
                            // @ts-ignore
                            query[key] = Utils.BigNumber.make(query[key]).toString();
                        }
                    } else {
                        query[key] = query[key];
                    }
                });

                // @ts-ignore
                request.query = query;

                return h.continue;
            },
        });
    },
};
