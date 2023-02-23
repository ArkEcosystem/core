import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import makeSemaphore, { Semaphore } from "semaphore";

type PluginOptions = {
    levelOne: LevelOptions;
    levelTwo: LevelOptions;
};

type LevelOptions = {
    concurrency: number;
    queueLimit: number;
};

type SemaphoreOptions = {
    levelTwoFields: string[];
};

enum Level {
    One = 1,
    Two = 2,
}

export const semaphore = {
    name: "onPreHandler",
    version: "1.0.0",
    register(server: Hapi.Server, options: PluginOptions): void {
        const semaphores = new Map<Level, Semaphore>();
        semaphores.set(Level.One, makeSemaphore(options.levelOne.concurrency));
        semaphores.set(Level.Two, makeSemaphore(options.levelTwo.concurrency));

        const semaphoresQueueLimit = new Map<Level, number>();
        semaphoresQueueLimit.set(Level.One, options.levelOne.queueLimit);
        semaphoresQueueLimit.set(Level.Two, options.levelTwo.queueLimit);

        const requestLevels = new Map<Hapi.Request, Level>();

        server.ext("onPreHandler", async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            const options = getRouteSemaphoreOptions(request);

            console.log("PRE HANDLER: ");

            if (options) {
                const level = getLevel(request, options);
                const sem = semaphores.get(level)!;

                // @ts-ignore
                if (sem.queue.length >= semaphoresQueueLimit.get(level)!) {
                    return Boom.tooManyRequests();
                }

                requestLevels.set(request, level);

                console.log("RequestLevels: ", requestLevels.size);
                console.log("Capacity: ", level, sem.capacity);
                console.log("Current: ", level, sem.current);
                // @ts-ignore
                console.log("Queue: ", level, sem.queue.length);

                await new Promise<void>((resolve) => {
                    sem.take(() => {
                        resolve();
                    });
                });

                console.log("ENTER");
            }

            return h.continue;
        });

        server.ext("onPreResponse", async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            console.log("POST HANDLER: ");

            const level = requestLevels.get(request);

            if (level) {
                requestLevels.delete(request);
                const sem = semaphores.get(level)!;

                sem.leave();

                console.log("RequestLevels: ", requestLevels.size);
                console.log("Capacity: ", level, sem.capacity);
                console.log("Current: ", level, sem.current);
                // @ts-ignore
                console.log("Queue: ", level, sem.queue.length);
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

        if (options.levelTwoFields.includes(field)) {
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
    if (Object.keys(request.query).some((key) => options.levelTwoFields.includes(key))) {
        return Level.Two;
    }

    return Level.One;
};

const getRouteSemaphoreOptions = (request): SemaphoreOptions | undefined => {
    if (request.route.settings.plugins.semaphore && request.route.settings.plugins.semaphore.levelTwoFields) {
        return request.route.settings.plugins.semaphore;
    }

    return undefined;
};
