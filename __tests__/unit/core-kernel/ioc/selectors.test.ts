import { Container, inject, injectable, tagged } from "../../../../packages/core-kernel/src/ioc";
import { anyAncestorOrTargetTaggedFirst } from "../../../../packages/core-kernel/src/ioc/selectors";

interface WalletRepository {}

@injectable()
class BlockchainWalletRepository implements WalletRepository {}

@injectable()
class PoolWalletRepository implements WalletRepository {
    @inject("WalletRepository")
    @tagged("state", "blockchain")
    public readonly blockchainWalletRepository!: WalletRepository;
}

@injectable()
class TransactionHandler {
    @inject("WalletRepository")
    public readonly walletRepository!: WalletRepository;
}

@injectable()
class BlockchainState {
    @inject("TransactionHandler")
    @tagged("state", "blockchain")
    public readonly blockchainTransactionHandler!: TransactionHandler;
}

@injectable()
class PoolState {
    @inject("TransactionHandler")
    @tagged("state", "pool")
    public readonly poolTransactionHandler!: TransactionHandler;
}

const container = new Container();
container
    .bind("WalletRepository")
    .to(BlockchainWalletRepository)
    .when(anyAncestorOrTargetTaggedFirst("state", "blockchain"));
container
    .bind("WalletRepository")
    .to(PoolWalletRepository)
    .when(anyAncestorOrTargetTaggedFirst("state", "pool"));
container.bind("TransactionHandler").to(TransactionHandler);

describe("anyAncestorOrTargetTaggedFirst", () => {
    it("should match tag on target", () => {
        const poolWalletRepository = container.resolve(PoolWalletRepository);

        expect(poolWalletRepository.blockchainWalletRepository).toBeInstanceOf(BlockchainWalletRepository);
    });

    it("should match tag on ancestor", () => {
        const blockchainState = container.resolve(BlockchainState);

        expect(blockchainState.blockchainTransactionHandler.walletRepository).toBeInstanceOf(
            BlockchainWalletRepository,
        );
    });

    it("should match first tag", () => {
        const poolState = container.resolve(PoolState);
        const poolWalletRepository = poolState.poolTransactionHandler.walletRepository as PoolWalletRepository;

        expect(poolWalletRepository).toBeInstanceOf(PoolWalletRepository);
        expect(poolWalletRepository.blockchainWalletRepository).toBeInstanceOf(BlockchainWalletRepository);
    });

    it("should not match when attempting to load without tag", () => {
        expect(() => container.resolve(TransactionHandler)).toThrow();
    });
});
