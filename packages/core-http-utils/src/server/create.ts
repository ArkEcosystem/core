import Hapi from "hapi";
import { monitorServer } from "./monitor";

export async function createServer(options, callback: any = null) {
    const server = new Hapi.Server(options);

    await server.register([require("vision"), require("inert"), require("lout")]);

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
