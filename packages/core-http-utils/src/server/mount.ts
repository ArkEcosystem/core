import { app } from "@arkecosystem/core-kernel";

async function mountServer(name, server) {
    try {
        await server.start();

        app.resolve("logger").info(`${name} Server running at: ${server.info.uri}`);

        return server;
    } catch (error) {
        // app.terminate(`Could not start ${name} Server!`, error);
    }
}

export { mountServer };
