import { Application } from "@packages/core-kernel/src";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import { MemoryEventDispatcher } from "@packages/core-kernel/src/services/events/drivers/memory";
import { Database } from "@packages/core-webhooks/src/database";
import { Identifiers as WebhookIdentifiers } from "@packages/core-webhooks/src/identifiers";
import { Server } from "@packages/core-webhooks/src/server";
import { dirSync } from "tmp";

export const initApp = (): Application => {
    const app: Application = new Application(new Container());

    app.bind(Identifiers.EventDispatcherService).to(MemoryEventDispatcher).inSingletonScope();

    app.bind(Identifiers.LogService).toConstantValue({
        notice: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
    });

    app.bind("path.cache").toConstantValue(dirSync().name);

    app.bind<Database>(WebhookIdentifiers.Database).to(Database).inSingletonScope();

    app.get<Database>(WebhookIdentifiers.Database).boot();

    // Setup Server...
    app.bind(WebhookIdentifiers.Server).to(Server).inSingletonScope();

    return app;
};

export const initServer = async (app: Application, serverOptions: any): Promise<Server> => {
    let server = app.get<Server>(WebhookIdentifiers.Server);

    server.register(serverOptions);

    await server.boot();

    return server;
};

export const request = async (server: Server, method, path, payload = {}) => {
    const response = await server.inject({ method, url: `http://localhost:4004/api/${path}`, payload });

    return { body: response.result as any, status: response.statusCode };
};
