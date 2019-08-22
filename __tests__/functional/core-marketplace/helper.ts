import { TransactionFactory } from "../../../../__tests__/helpers";
import {
    BridgechainRegistrationBuilder,
    BridgechainResignationBuilder,
    BridgechainUpdateBuilder,
    BusinessRegistrationBuilder,
    BusinessResignationBuilder,
    BusinessUpdateBuilder,
} from "../../src/builders";
import {
    IBridgechainRegistrationAsset,
    IBridgechainUpdateAsset,
    IBusinessRegistrationAsset,
    IBusinessUpdateAsset,
} from "../../src/interfaces";

export class MarketplaceTransactionFactory extends TransactionFactory {
    public static businessRegistration(businessRegistrationAsset: IBusinessRegistrationAsset): TransactionFactory {
        const businessRegistrationBuilder = new BusinessRegistrationBuilder();
        businessRegistrationBuilder.businessRegistrationAsset(businessRegistrationAsset);
        return new TransactionFactory(businessRegistrationBuilder);
    }

    public static businessResignation(): TransactionFactory {
        return new TransactionFactory(new BusinessResignationBuilder());
    }

    public static businessUpdate(businessUpdateAsset: IBusinessUpdateAsset): TransactionFactory {
        const businessUpdateBuilder = new BusinessUpdateBuilder();
        businessUpdateBuilder.businessUpdateAsset(businessUpdateAsset);
        return new TransactionFactory(businessUpdateBuilder);
    }

    public static bridgechainRegistration(
        bridgechainRegistrationAsset: IBridgechainRegistrationAsset,
    ): TransactionFactory {
        const bridgechainRegistrationBuilder = new BridgechainRegistrationBuilder();
        bridgechainRegistrationBuilder.bridgechainRegistrationAsset(bridgechainRegistrationAsset);
        return new TransactionFactory(bridgechainRegistrationBuilder);
    }

    public static bridgechainResignation(registeredBridgechainId: string): TransactionFactory {
        const bridgechainResignationBuilder = new BridgechainResignationBuilder();
        bridgechainResignationBuilder.businessResignationAsset(registeredBridgechainId);
        return new TransactionFactory(bridgechainResignationBuilder);
    }

    public static bridgechainUpdate(bridgechainUpdateAsset: IBridgechainUpdateAsset): TransactionFactory {
        const bridgechainUpdateBuilder = new BridgechainUpdateBuilder();
        bridgechainUpdateBuilder.bridgechainUpdateAsset(bridgechainUpdateAsset);
        return new TransactionFactory(bridgechainUpdateBuilder);
    }
}
