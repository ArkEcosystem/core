import { Container } from "@packages/core-kernel";
import { ProcessorDynamicFeeExtension } from "@packages/core-transaction-pool/src/processor-dynamic-fee-extension";
import { Identities, Managers, Transactions } from "@packages/crypto";

Managers.configManager.getMilestone().aip11 = true;
const transaction1 = Transactions.BuilderFactory.transfer()
    .version(2)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .sign("sender's secret")
    .build();

const dynamicFeeMatcher = {
    throwIfCannotBroadcast: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionPoolDynamicFeeMatcher).toConstantValue(dynamicFeeMatcher);

describe("ProcessorDynamicFeeExtension.throwIfCannotBroadcast", () => {
    it("should call dynamicFeeMatcher.throwIfCannotBroadcast", async () => {
        const processorDynamicFeeExtension = container.resolve(ProcessorDynamicFeeExtension);
        await processorDynamicFeeExtension.throwIfCannotBroadcast(transaction1);

        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toBeCalledTimes(1);
        expect(dynamicFeeMatcher.throwIfCannotBroadcast).toHaveBeenCalledWith(transaction1);
    });
});
