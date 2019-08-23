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

export class MarketplaceTransactionFactory extends TransactionFactory {}
