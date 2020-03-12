import "jest-extended";

import { DelegateTracker } from "@packages/core-forger/src/delegate-tracker";
import { BIP39 } from "@packages/core-forger/src/methods/bip39";
import { Application } from "@packages/core-kernel";
import { Container } from "@packages/core-kernel/src";

import { dummy } from "./__utils__/create-block-with-transactions";

let app: Application;

const logger = {
    error: jest.fn(),
    debug: jest.fn(),
};

beforeEach(async () => {
    app = new Application(new Container.Container());
    app.bind(Container.Identifiers.LogService).toConstantValue(logger);

    @Container.injectable()
    class MockDatabaseService {
        public getActiveDelegates() {
            return {};
        }
    }

    @Container.injectable()
    class MockWalletRepository {
        public findByPublicKey() {
            return {};
        }
    }

    @Container.injectable()
    class MockBlockchainService {
        public getLastBlock() {
            return {};
        }
    }

    app.bind(Container.Identifiers.DatabaseService).to(MockDatabaseService);

    app.bind(Container.Identifiers.BlockchainService).to(MockBlockchainService);

    app.bind(Container.Identifiers.WalletRepository).to(MockWalletRepository);

    /**
     * inSingletonScope()
        .when(Container.Selectors.anyAncestorOrTargetTaggedFirst("state", "blockchain"));
     */
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
});

describe("DelegateTracker", () => {
    let delegateTracker: DelegateTracker;

    beforeEach(() => {
        delegateTracker = app.resolve<DelegateTracker>(DelegateTracker);
    });

    describe("initialise", () => {
        it("should set-up delegates", async () => {
            const delegate = new BIP39(dummy.plainPassphrase);

            delegateTracker.initialize([delegate]);
            expect((delegateTracker as any).delegates).toEqual([delegate]);
        });
    });
});
