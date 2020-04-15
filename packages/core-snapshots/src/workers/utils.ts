import { Models } from "@arkecosystem/core-database";
import { createConnection, Connection } from "typeorm";

export const connect = async (options: any): Promise<Connection> => {
    return createConnection({
        ...options.connection,
        namingStrategy: new Models.SnakeNamingStrategy(),
        entities: [Models.Block, Models.Transaction, Models.Round],
    });
};
