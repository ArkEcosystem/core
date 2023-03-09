import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import makeSemaphore, { Semaphore } from "semaphore";

type PluginOptions = {
    enabled: boolean;
    database: {
        levelOne: LevelOptions;
        levelTwo: LevelOptions;
    };
    memory: {
        levelOne: LevelOptions;
        levelTwo: LevelOptions;
    };
};

type LevelOptions = {
    concurrency: number;
    queueLimit: number;
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
    register(server: Hapi.Server, options: PluginOptions): void {
        if (!options.enabled) {
            return;
        }

        const semaphores = new Map<Level, Semaphore>();
        semaphores.set(Level.One, makeSemaphore(options.database.levelOne.concurrency));
        semaphores.set(Level.Two, makeSemaphore(options.database.levelTwo.concurrency));

        const semaphoresConcurrency = new Map<Level, number>();
        semaphoresConcurrency.set(Level.One, options.database.levelOne.concurrency);
        semaphoresConcurrency.set(Level.Two, options.database.levelTwo.concurrency);

        const semaphoresQueueLimit = new Map<Level, number>();
        semaphoresQueueLimit.set(Level.One, options.database.levelOne.queueLimit);
        semaphoresQueueLimit.set(Level.Two, options.database.levelTwo.queueLimit);

        const requestLevels = new Map<Hapi.Request, Level>();

        server.ext("onPreHandler", async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            const options = getRouteSemaphoreOptions(request);

            if (options.enabled) {
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

const isFullSemaphoreOptions = (b: SemaphoreOptions): b is FullSemaphoreOptions => {
    return !!b.queryLevelOptions;
};

const getLevel = (request: Hapi.Request, options: SemaphoreOptions): Level => {
    if (isFullSemaphoreOptions(options)) {
        if (usesDiverseIndex(request, options)) {
            return Level.One;
        }

        const levels = [orderByLevel(request, options), offsetLevel(request, options), queryLevel(request, options)];

        return levels.includes(Level.Two) ? Level.Two : Level.One;
    }

    return Level.One;
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

const offsetLevel = (request: Hapi.Request, options: FullSemaphoreOptions): Level => {
    if (request.query.offset && request.query.offset > 10_000) {
        return Level.Two;
    }

    if (request.query.page && request.query.limit) {
        const offset = request.query.page * request.query.limit;

        if (offset > 10_000) {
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
    const result = {
        enabled: false,
    };

    if (request.route.settings.plugins.semaphore) {
        return { ...result, ...request.route.settings.plugins.semaphore };
    }

    return {
        enabled: false,
    };
};
