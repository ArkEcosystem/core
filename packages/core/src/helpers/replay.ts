import { app, Contracts } from "@arkecosystem/core-kernel";

export const setUpLite = async (options): Promise<Contracts.Kernel.IContainer> => {
    // await app.setUp(version, options, {
    //     options: {
    //         "@arkecosystem/core-blockchain": { replay: true },
    //     },
    //     include: [
    //         "@arkecosystem/core-event-emitter",
    //         "@arkecosystem/core-logger-pino",
    //         "@arkecosystem/core-state",
    //         "@arkecosystem/core-database-postgres",
    //         "@arkecosystem/core-blockchain",
    //     ],
    // });

    return app;
};
