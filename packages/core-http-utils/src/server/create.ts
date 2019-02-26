import Hapi from "hapi";
import { monitorServer } from "./monitor";

export async function createServer(options, callback: any = null, plugins?: any[]) {
    const server = new Hapi.Server(options);

    if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
            console.log(plugin);
            await server.register(plugin);
        }
    }

    await server.register({
        plugin: require("hapi-trailing-slash"),
        options: { method: "remove" },
    });

    if (callback) {
        await callback(server);
    }

    if (process.env.NODE_ENV === "test") {
        await monitorServer(server);
    }

    return server;
}
