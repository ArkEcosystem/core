import { app } from "@arkecosystem/core-kernel";

export const mountServer = async (name, server) => {
    try {
        await server.start();

        app.resolve("log").info(`${name} Server running at: ${server.info.uri}`);

        return server;
    } catch (error) {
        app.terminate(`Could not start ${name} Server!`, error);
    }
};
