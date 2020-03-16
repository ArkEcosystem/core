import "jest-extended";

import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { Container, Services } from "@packages/core-kernel/src";
import { Wallet } from "@packages/core-state/src/wallets";
import { Sandbox } from "@packages/core-test-framework/src";
import { Managers } from "@packages/crypto/src";

export const setup = async activeDelegates => {
    const sandbox = new Sandbox();

    const error: jest.SpyInstance = jest.fn();
    const debug: jest.SpyInstance = jest.fn();

    const logger = {
        error,
        debug,
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
                getAttribute: () => activeDelegates.find(wallet => wallet.publicKey === publicKey).publicKey,
            };
        }
    }

    @Container.injectable()
    class MockBlockchainService {
        public getLastBlock() {
            return {
                data: { height: 3, timestamp: 111150 },
            };
        }
    }

    sandbox.app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

    sandbox.app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

    sandbox.app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

    const delegateTracker = sandbox.app.resolve(DelegateTracker);

    await sandbox.boot();

    // todo: get rid of the need for this, requires an instance based crypto package
    Managers.configManager.setConfig(
        sandbox.app.get<Services.Config.ConfigRepository>(Container.Identifiers.ConfigRepository).get("crypto"),
    );

    return {
        sandbox,
        spies: {
            logger,
        },
        delegateTracker,
    };
};
