import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Connection, getCustomRepository } from "typeorm";

import { clearCoreDatabase, getCoreDatabaseConnection } from "../__support__";
import { BlockRepository } from "../../../../packages/core-database/src/repositories/block-repository";
import { TransactionRepository } from "../../../../packages/core-database/src/repositories/transaction-repository";
import { TransactionSearchService } from "../../../../packages/core-database/src/services/transaction-search-service";
import { BIP39 } from "../../../../packages/core-forger/src/methods/bip39";

let connection: Connection | undefined;

const walletRepository = {
    findByAddress: jest.fn(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.WalletRepository).toConstantValue(walletRepository);

beforeAll(async () => {
    connection = await getCoreDatabaseConnection();
    container.bind(Container.Identifiers.DatabaseConnection).toConstantValue(connection);
    container
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue(getCustomRepository(TransactionRepository));
    container.bind(Container.Identifiers.DatabaseTransactionSearchService).to(TransactionSearchService);
});

beforeEach(async () => {
    await clearCoreDatabase(connection);
    walletRepository.findByAddress.mockReset();
});

const transaction1 = Transactions.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("1")
    .fee("100")
    .sign("sender's secret")
    .build();
const transaction2 = Transactions.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("2")
    .fee("200")
    .sign("sender's secret")
    .build();
const transaction3 = Transactions.BuilderFactory.transfer()
    .version(1)
    .amount("100")
    .recipientId(Identities.Address.fromPassphrase("recipient's secret"))
    .nonce("3")
    .fee("300")
    .sign("sender's secret")
    .build();

const bip39 = new BIP39("generator's secret");
const block1 = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));
const block2 = bip39.forge([transaction1.data], {
    timestamp: Crypto.Slots.getTime() - 60,
    previousBlock: block1.data,
    reward: new Utils.BigNumber("100"),
});
const block3 = bip39.forge([transaction2.data, transaction3.data], {
    timestamp: Crypto.Slots.getTime() - 30,
    previousBlock: block2.data,
    reward: new Utils.BigNumber("100"),
});

describe("TransactionRepository.searchByCriteria", () => {
    it("should find transaction", async () => {
        const blockRepository = getCustomRepository(BlockRepository);
        await blockRepository.saveBlocks([block1, block2, block3]);
        const transactionSearchService = container.get<Contracts.Database.TransactionSearchService>(
            Container.Identifiers.DatabaseTransactionSearchService,
        );
        const criteria = {
            recipientId: ["DPNQjSnZg1SkJr5ZaBw9QGiYeuFDV7mDnh", "D6Z26L69gdk9qYmTv5uzk3uGepigtHY4ax"],
        };

        const results = await transactionSearchService.search(criteria, [], { offset: 0, limit: 100 });
        console.log(results);
        expect(results).toBeTruthy();
    });
});
