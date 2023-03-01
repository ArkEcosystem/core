import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import makeSemaphore, { Semaphore } from "semaphore";

type PluginOptions = {
    enabled: boolean;
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
        if (!options.enabled) {
            return;
        }

        const semaphores = new Map<Level, Semaphore>();
        semaphores.set(Level.One, makeSemaphore(options.levelOne.concurrency));
        semaphores.set(Level.Two, makeSemaphore(options.levelTwo.concurrency));

        const semaphoresConcurrency = new Map<Level, number>();
        semaphoresConcurrency.set(Level.One, options.levelOne.concurrency);
        semaphoresConcurrency.set(Level.Two, options.levelTwo.concurrency);

        const semaphoresQueueLimit = new Map<Level, number>();
        semaphoresQueueLimit.set(Level.One, options.levelOne.queueLimit);
        semaphoresQueueLimit.set(Level.Two, options.levelTwo.queueLimit);

        const requestLevels = new Map<Hapi.Request, Level>();

        server.ext("onPreHandler", async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            const options = getRouteSemaphoreOptions(request);

            if (options) {
                const level = getLevel(request, options);
                const sem = semaphores.get(level)!;

                if (
                    // @ts-ignore
                    sem.queue.length + (sem.current - semaphoresConcurrency.get(level)!) >=
                    semaphoresQueueLimit.get(level)!
                ) {
                    return Boom.tooManyRequests();
                }

                requestLevels.set(request, level);

                await new Promise<void>((resolve) => {
                    sem.take(() => {
                        resolve();
                    });
                });
            }

            return h.continue;
        });

        server.events.on("response", (request: Hapi.Request) => {
            const level = requestLevels.get(request);

            if (level) {
                requestLevels.delete(request);
                const sem = semaphores.get(level)!;

                sem.leave();
            }
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
