import Hapi from "@hapi/hapi";

type SemaphoreOptions = {
    nonIndexedFields: string[];
};

enum Level {
    One = 1,
    Two = 2,
}

export const semaphore = {
    name: "onPreHandler",
    version: "1.0.0",
    register(server: Hapi.Server, options: {}): void {
        server.ext("onPreHandler", (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            console.log("semaphore");

            console.log(request.query);
            console.log("Semaphore opt", getRouteSemaphoreOptions(request));

            const options = getRouteSemaphoreOptions(request);

            if (options) {
                console.log("orderByLevel: ", orderByLevel(request, options));
                console.log("offsetLevel: ", offsetLevel(request, options));
                console.log("queryLevel: ", queryLevel(request, options));
                console.log("getLevel: ", getLevel(request, options));
            }

            return h.continue;
        });
    },
};

const getLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
    const levels = [orderByLevel(request, options), offsetLevel(request, options), queryLevel(request, options)];

    return levels.includes(Level.Two) ? Level.Two : Level.One;
};

const orderByLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
    if (request.query.orderBy && request.query.orderBy.length) {
        const field = request.query.orderBy[0].split(":")[0];

        if (options.nonIndexedFields.includes(field)) {
            return Level.Two;
        }
    }

    return Level.One;
};

const offsetLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
    if (request.query.page && request.query.limit) {
        const offset = request.query.page * request.query.limit;

        if (offset > 10_000) {
            return Level.Two;
        }
    }

    return Level.One;
};

const queryLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
    if (Object.keys(request.query).some((key) => options.nonIndexedFields.includes(key))) {
        return Level.Two;
    }

    return Level.One;
};

const getRouteSemaphoreOptions = (request): SemaphoreOptions | undefined => {
    return request.route.settings.plugins.semaphore;
};
