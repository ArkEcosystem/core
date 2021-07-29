import { Container, Providers, Services } from "@arkecosystem/core-kernel";

import { One, Two, TransactionHandlerConstructor } from "./handlers";
import { TransactionHandlerProvider } from "./handlers/handler-provider";
import { TransactionHandlerRegistry } from "./handlers/handler-registry";

export class ServiceProvider extends Providers.ServiceProvider {
    public static getTransactionHandlerConstructorsBinding(): (
        context: Container.interfaces.Context,
    ) => TransactionHandlerConstructor[] {
        return (context: Container.interfaces.Context) => {
            type BindingDictionary = Container.interfaces.Lookup<Container.interfaces.Binding<unknown>>;
            const handlerConstructors: TransactionHandlerConstructor[] = [];
            let container: Container.interfaces.Container | null = context.container;

            do {
                const bindingDictionary = container["_bindingDictionary"] as BindingDictionary;
                const handlerBindings = bindingDictionary.getMap().get(Container.Identifiers.TransactionHandler) ?? [];

                for (const handlerBinding of handlerBindings) {
                    if (handlerBinding.implementationType) {
                        handlerConstructors.push(handlerBinding.implementationType as TransactionHandlerConstructor);
                    }
                }

                container = container.parent;
            } while (container);

            return handlerConstructors;
        };
    }

    /**
     * @returns {Promise<void>}
     * @memberof ServiceProvider
     */
    public async register(): Promise<void> {
        this.app
            .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
            .to(Services.Attributes.AttributeSet)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.TransactionHandlerProvider)
            .to(TransactionHandlerProvider)
            .inSingletonScope();

        this.app
            .bind(Container.Identifiers.WalletRepository)
            .toConstantValue(null)
            .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "null"));

        this.app.bind(Container.Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(One.SecondSignatureRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.SecondSignatureRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.IpfsTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.HtlcLockTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.HtlcClaimTransactionHandler);
        this.app.bind(Container.Identifiers.TransactionHandler).to(Two.HtlcRefundTransactionHandler);

        this.app
            .bind(Container.Identifiers.TransactionHandlerConstructors)
            .toDynamicValue(ServiceProvider.getTransactionHandlerConstructorsBinding());

        this.app.bind(Container.Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry);
    }

    /**
     * @returns {Promise<boolean>}
     * @memberof ServiceProvider
     */
    public async required(): Promise<boolean> {
        return true;
    }
}
