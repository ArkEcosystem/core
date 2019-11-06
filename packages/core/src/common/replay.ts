import { Contracts } from "@arkecosystem/core-kernel";
import { createApplication } from "./create-application";

// todo: review the implementation
export const setUpLite = async (options): Promise<Contracts.Kernel.Application> => {
    const app: Contracts.Kernel.Application = await createApplication();

    // await app.setUp(version, options, {
    //     options: {
    //         "@arkecosystem/core-blockchain": { replay: true },
    //     },
    //     include: [
    //         "@arkecosystem/core-state",
    //         "@arkecosystem/core-database-postgres",
    //         "@arkecosystem/core-blockchain",
    //     ],
    // });

    return app;
};
