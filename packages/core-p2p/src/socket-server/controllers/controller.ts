import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    protected readonly logger!: Contracts.Kernel.Logger;
}
