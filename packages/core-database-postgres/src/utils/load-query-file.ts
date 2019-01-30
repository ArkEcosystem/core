import { app } from "@arkecosystem/core-kernel";
import path from "path";
import { QueryFile } from "pg-promise";

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
        app.logger.error(query.error.toString());
    }

    return query;
}
