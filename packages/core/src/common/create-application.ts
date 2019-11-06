import { Application, Container, Contracts } from "@arkecosystem/core-kernel";

export const createApplication = async (options?: object): Promise<Contracts.Kernel.Application> => {
    const app: Contracts.Kernel.Application = new Application(new Container.Container());

    if (options) {
        await app.bootstrap(options as any);

        await app.boot();
    }

    return app;
};
