import { bignumify } from "@arkecosystem/core-utils";
import Hapi from "hapi";

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

const register = async (server: Hapi.Server, options: object): Promise<void> => {
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
                    query[key] =
                        // @ts-ignore
                        // tslint:disable-next-line triple-equals
                        query[key] == Number(query[key]) ? Number(query[key]) : bignumify(query[key]).toString();
                } else {
                    query[key] = query[key];
                }
            });

            // @ts-ignore
            request.query = query;

            return h.continue;
        },
    });
};

export = {
    register,
    name: "core-caster",
    version: "1.0.0",
};
