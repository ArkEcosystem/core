/* tslint:disable:forin prefer-for-of*/

import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import path from "path";
import { QueryFile } from "pg-promise";

export function camelizeColumns(pgp, data) {
    const tmp = data[0];

    for (const prop in tmp) {
        const camel = pgp.utils.camelize(prop);

        if (!(camel in tmp)) {
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                d[camel] = d[prop];
                delete d[prop];
            }
        }
    }
}

export function loadQueryFile(directory, file) {
    const fullPath = path.join(directory, file);

    const options = {
        minify: true,
        params: {
            schema: "public",
        },
    };

    const query = new QueryFile(fullPath, options);

    if (query.error) {
        app.resolvePlugin<Logger.ILogger>("logger").error(query.error.toString());
    }

    return query;
}
