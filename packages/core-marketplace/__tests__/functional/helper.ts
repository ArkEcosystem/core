import { TransactionFactory } from "../../../../__tests__/helpers";
import { BusinessRegistrationBuilder } from "../../src/builders";
import { IBusinessRegistrationAsset } from "../../src/interfaces";

export class MarketplaceTrxFactory extends TransactionFactory {
    public static businessRegistration(businessRegistrationAsset: IBusinessRegistrationAsset): TransactionFactory {
        const businessRegistrationBuilder = new BusinessRegistrationBuilder();
        businessRegistrationBuilder.businessRegistrationAsset(businessRegistrationAsset);
        return new TransactionFactory(businessRegistrationBuilder);
    }
}
