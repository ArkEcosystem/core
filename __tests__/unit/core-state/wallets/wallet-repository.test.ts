import "jest-extended";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Sandbox } from "@packages/core-test-framework/src";

import { Managers } from "@arkecosystem/crypto";
import { defaults } from "../../../../packages/core-state/src/defaults";
import { StateStore } from "../../../../packages/core-state/src/stores/state";
import { WalletRepository, Wallet } from "@arkecosystem/core-state/src/wallets";
import { registerIndexers } from "../../../../packages/core-state/src/wallets/indexers";
import { knownAttributes } from "@arkecosystem/core-test-framework/src/internal/wallet-attributes";

let sandbox: Sandbox;
let walletRepo: WalletRepository;

beforeAll(() => {
    sandbox = new Sandbox();

    registerIndexers(sandbox.app);

    sandbox.app
        .bind(Container.Identifiers.WalletFactory)
        .toFactory<Contracts.State.Wallet>(() => (address: string) =>
            new Wallet(
                address,
                knownAttributes,
            ),
        );

    sandbox.app
        .bind(Container.Identifiers.PluginConfiguration)
        .to(Providers.PluginConfiguration)
        .inSingletonScope();

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastBlocks", defaults.storage.maxLastBlocks);

    sandbox.app
        .get<any>(Container.Identifiers.PluginConfiguration)
        .set("storage.maxLastTransactionIds", defaults.storage.maxLastTransactionIds);

    sandbox.app
        .bind(Container.Identifiers.StateStore)
        .to(StateStore)
        .inSingletonScope();
    
    sandbox.app
        .bind(Container.Identifiers.WalletRepository)
        .to(WalletRepository);

    walletRepo = sandbox.app
        .get(Container.Identifiers.WalletRepository);

    Managers.configManager.setFromPreset("testnet");
});

beforeEach(() => {
    walletRepo.reset();
});

describe("Wallet Repository", () => {
    it("should create a wallet", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(wallet.address).toEqual("abcd");
        expect(wallet).toBeInstanceOf(Wallet);
    });

    it("should be able to look up indexers", () => {
        const expected = [
            'addresses',
            'publicKeys',
            'usernames',
            'resignations',
            'locks',
            'ipfs'
        ];
        expect(walletRepo.getIndexNames()).toEqual(expected);
    });

    it("should get wallets by address", () => {
        const wallet = walletRepo.createWallet("abcd");
        expect(walletRepo.findByAddress("abcd")).toEqual(wallet);
    });
});