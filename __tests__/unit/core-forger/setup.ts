import "jest-extended";

import { CryptoSuite } from "@packages/core-crypto";
import { GetActiveDelegatesAction } from "@packages/core-database/src/actions";
import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { Container, Services } from "@packages/core-kernel";
import { Wallet } from "@packages/core-state/src/wallets";
import { Sandbox } from "@packages/core-test-framework/src";

export const mockLastBlock = {
    data: { height: 3, timestamp: 16 },
};

export const setup = async (activeDelegates, cryptoSuite: CryptoSuite.CryptoSuite) => {
    const sandbox = new Sandbox(cryptoSuite);

    const error: jest.SpyInstance = jest.fn();
    const debug: jest.SpyInstance = jest.fn();
    const warning: jest.SpyInstance = jest.fn();

    const logger = {
        error,
        debug,
        warning,
    };

    sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    @Container.injectable()
    class MockDatabaseService {
        public async getActiveDelegates(): Promise<Wallet[]> {
            return activeDelegates;
        }
    }

    @Container.injectable()
    class MockWalletRepository {
        public findByPublicKey(publicKey: string) {
            return {
                getAttribute: () => activeDelegates.find((wallet) => wallet.publicKey === publicKey).publicKey,
            };
        }
    }

    @Container.injectable()
    class MockBlockchainService {
        public getLastBlock() {
            return mockLastBlock;
        }
    }

    sandbox.app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

    sandbox.app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

    sandbox.app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

    sandbox.app.bind(Container.Identifiers.TriggerService).to(Services.Triggers.Triggers).inSingletonScope();

    sandbox.app
        .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
        .bind("getActiveDelegates", new GetActiveDelegatesAction(sandbox.app));

    const delegateTracker = sandbox.app.resolve(DelegateTracker);

    await sandbox.boot();

    return {
        sandbox,
        spies: {
            logger,
        },
        delegateTracker,
    };
};
