export async function monitorServer(server) {
    return server.register({
        plugin: require("good"),
        options: {
            reporters: {
                console: [
                    {
                        module: "good-squeeze",
                        name: "Squeeze",
                        args: [{ log: "*", response: "*", request: "*" }],
                    },
                    {
                        module: "good-console",
                    },
                    "stdout",
                ],
            },
        },
    });
}
