import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import makeSemaphore, { Semaphore } from "semaphore";

type PluginOptions = {
    enabled: boolean;
    database: {
        levelOne: LevelOneOptions;
        levelTwo: LevelOptions;
    };
    memory: {
        levelOne: LevelOneOptions;
        levelTwo: LevelOptions;
    };
};

type LevelOptions = {
    concurrency: number;
    queueLimit: number;
};

type LevelOneOptions = LevelOptions & {
    maxOffset: number;
};

type QueryLevelOptions = {
    field: string;
    asc: boolean;
    desc: boolean;
    allowSecondOrderBy: boolean;
    diverse: boolean;
};

type SemaphoreOptions = {
    enabled: boolean;
    type: "database" | "memory";
    queryLevelOptions?: QueryLevelOptions[];
};

type FullSemaphoreOptions = Required<SemaphoreOptions>;

enum Level {
    One = 1,
    Two = 2,
}

export const semaphore = {
    name: "onPreHandler",
    version: "1.0.0",
    register(server: Hapi.Server, pluginOptions: PluginOptions): void {
        if (!pluginOptions.enabled) {
            return;
        }

        const semaphores = { database: new Map<Level, Semaphore>(), memory: new Map<Level, Semaphore>() };
        semaphores.database.set(Level.One, makeSemaphore(pluginOptions.database.levelOne.concurrency));
        semaphores.database.set(Level.Two, makeSemaphore(pluginOptions.database.levelTwo.concurrency));
        semaphores.memory.set(Level.One, makeSemaphore(pluginOptions.memory.levelOne.concurrency));
        semaphores.memory.set(Level.Two, makeSemaphore(pluginOptions.memory.levelTwo.concurrency));

        const semaphoresConcurrency = { database: new Map<Level, number>(), memory: new Map<Level, number>() };
        semaphoresConcurrency.database.set(Level.One, pluginOptions.database.levelOne.concurrency);
        semaphoresConcurrency.database.set(Level.Two, pluginOptions.database.levelTwo.concurrency);
        semaphoresConcurrency.memory.set(Level.One, pluginOptions.memory.levelOne.concurrency);
        semaphoresConcurrency.memory.set(Level.Two, pluginOptions.memory.levelTwo.concurrency);

        const semaphoresQueueLimit = { database: new Map<Level, number>(), memory: new Map<Level, number>() };
        semaphoresQueueLimit.database.set(Level.One, pluginOptions.database.levelOne.queueLimit);
        semaphoresQueueLimit.database.set(Level.Two, pluginOptions.database.levelTwo.queueLimit);
        semaphoresQueueLimit.memory.set(Level.One, pluginOptions.memory.levelOne.queueLimit);
        semaphoresQueueLimit.memory.set(Level.Two, pluginOptions.memory.levelTwo.queueLimit);

        const requestLevels = new Map<Hapi.Request, Level>();

        server.ext("onPreHandler", async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            const options = getRouteSemaphoreOptions(request);

            if (options.enabled) {
                const level = getLevel(request, options);
                const sem = semaphores[options.type].get(level)!;

                if (
                    // @ts-ignore
                    sem.queue.length + (sem.current - semaphoresConcurrency[options.type].get(level)!) >=
                    semaphoresQueueLimit[options.type].get(level)!
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
            const options = getRouteSemaphoreOptions(request);

            const level = requestLevels.get(request);

            if (level) {
                requestLevels.delete(request);
                const sem = semaphores[options.type].get(level)!;

                sem.leave();
            }
        });

        const isFullSemaphoreOptions = (b: SemaphoreOptions): b is FullSemaphoreOptions => {
            return !!b.queryLevelOptions;
        };

        const getLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
            if (isFullSemaphoreOptions(options)) {
                if (usesDiverseIndex(request, options)) {
                    return Level.One;
                }

                const levels = [
                    orderByLevel(request, options),
                    offsetLevel(request, options),
                    queryLevel(request, options),
                ];

                return levels.includes(Level.Two) ? Level.Two : Level.One;
            }

            return offsetLevel(request, options);
        };

        const usesDiverseIndex = (request: Hapi.Request, options: FullSemaphoreOptions): boolean => {
            const distributedIndices = options.queryLevelOptions
                .filter((option) => option.diverse)
                .map((option) => option.field);

            for (const key of Object.keys(request.query)) {
                if (distributedIndices.includes(key) && ["number", "string"].includes(typeof request.query[key])) {
                    return true;
                }
            }

            return false;
        };

        const orderByLevel = (request: Hapi.Request, options: FullSemaphoreOptions): Level => {
            if (request.query.orderBy && request.query.orderBy.length) {
                const orderBy = Array.isArray(request.query.orderBy) ? request.query.orderBy : [request.query.orderBy];

                const [field, sortOrder]: [string, "asc" | "desc"] = orderBy[0].split(":");

                const fieldOptions = options.queryLevelOptions.find((options) => options.field === field);

                if (!fieldOptions) {
                    return Level.Two;
                }

                if (!fieldOptions[sortOrder]) {
                    return Level.Two;
                }

                if (!fieldOptions.allowSecondOrderBy && orderBy.length > 1) {
                    return Level.Two;
                }
            }

            return Level.One;
        };

        const offsetLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
            const offset = pluginOptions[options.type].levelOne.maxOffset;

            if (request.query.offset && request.query.offset > offset) {
                return Level.Two;
            }

            if (request.query.page && request.query.limit) {
                if (request.query.page * request.query.limit > offset) {
                    return Level.Two;
                }
            }

            return Level.One;
        };

        const queryLevel = (request: Hapi.Request, options: FullSemaphoreOptions): Level => {
            const reservedFields = ["page", "limit", "transform", "offset", "orderBy"];
            const indices = options.queryLevelOptions.map((options) => options.field);

            for (const key of Object.keys(request.query)) {
                if (reservedFields.includes(key)) {
                    continue;
                }

                if (!indices.includes(key)) {
                    return Level.Two;
                }
            }

            return Level.One;
        };

        const getRouteSemaphoreOptions = (request): SemaphoreOptions => {
            const result: SemaphoreOptions = {
                enabled: false,
                type: "database",
            };

            if (request.route.settings.plugins.semaphore) {
                return { ...result, ...request.route.settings.plugins.semaphore };
            }

            return result;
        };
    },
};
