import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class Application {
    public constructor(public readonly container: Contracts.Kernel.Container.Container) {
        this.bind<Contracts.Kernel.Application>(Container.Identifiers.Application).toConstantValue(this as any);
    }

    public bind<T>(
        serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>,
    ): Contracts.Kernel.Container.BindingToSyntax<T> {
        return this.container.bind(serviceIdentifier);
    }

    /* istanbul ignore next */
    public get<T>(serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>): T {
        return this.container.get(serviceIdentifier);
    }

    public getTagged<T>(
        serviceIdentifier: Contracts.Kernel.Container.ServiceIdentifier<T>,
        key: string | number | symbol,
        value: any,
    ): T {
        return this.container.getTagged(serviceIdentifier, key, value);
    }
}
