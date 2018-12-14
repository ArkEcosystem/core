import { app } from "@arkecosystem/core-container";
import path from "path";
import { QueryFile } from "pg-promise";

const logger = app.resolvePlugin("logger");

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
        logger.error(query.error);
    }

    return query;
}
