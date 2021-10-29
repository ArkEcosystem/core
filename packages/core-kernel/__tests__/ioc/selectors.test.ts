import { anyAncestorOrTargetTaggedFirst } from "@packages/core-kernel/src/ioc/selectors";
import { Container, inject, injectable, tagged } from "@packages/core-kernel/src/ioc";

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
class TransactionHandlerUnknownKey {
    @inject("WalletRepository")
    @tagged("undefined", "blockchain")
    public readonly walletRepository!: WalletRepository;
}

@injectable()
class TransactionHandlerUnknownValue {
    @inject("WalletRepository")
    @tagged("state", "undefined")
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
container.bind("WalletRepository").to(PoolWalletRepository).when(anyAncestorOrTargetTaggedFirst("state", "pool"));
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

    it("should not match when attempting to load with unknown key tag", () => {
        expect(() => container.resolve(TransactionHandlerUnknownKey)).toThrow();
    });

    it("should not match when attempting to load with unknown value tag", () => {
        expect(() => container.resolve(TransactionHandlerUnknownValue)).toThrow();
    });
});
