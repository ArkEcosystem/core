import { app, Contracts } from "@arkecosystem/core-kernel";
import path from "path";
import { QueryFile } from "pg-promise";

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
        app.get<Contracts.Kernel.Log.ILogger>("log").error(query.error.toString());
    }

    return query;
};

export const rawQuery = (pgp, queryFile, parameters) => pgp.as.format(queryFile, parameters);
