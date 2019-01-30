import path from "path";
import { QueryFile } from "pg-promise";

import { app } from "@arkecosystem/core-kernel";

export const loadQueryFile = (directory, file) => {
    const fullPath = path.join(directory, file);

    const options = {
        minify: true,
        params: {
            schema: "public",
        },
    };

    const query = new QueryFile(fullPath, options);

    if (query.error) {
        app.logger.error(query.error.toString());
    }

    return query;
};

export const rawQuery = (pgp, queryFile, parameters) => pgp.as.format(queryFile, parameters);
