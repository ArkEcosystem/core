import "jest-extended";

import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { calculateApproval, calculateForgedTotal } from "@packages/core-kernel/src/utils/delegate-calculator";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;
let crypto: CryptoSuite.CryptoSuite;

beforeAll(() => {
    crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("devnet"));

    sandbox = new Sandbox(crypto);

    sandbox.app
        .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate");
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.voteBalance");

    crypto.CryptoManager.NetworkConfigManager.set("genesisBlock.totalAmount", 1000000 * 1e8);
});

const createWallet = (address: string): Contracts.State.Wallet =>
    new Wallets.Wallet(
        crypto.CryptoManager,
        address,
        new Services.Attributes.AttributeMap(
            sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
        ),
    );

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(crypto.CryptoManager, delegate, 1)).toBe(1);
        });

        it("should calculate correctly with default height 1", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(crypto.CryptoManager, delegate)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(16500 * 1e8),
            });

            expect(calculateApproval(crypto.CryptoManager, delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                forgedFees: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(10),
                forgedRewards: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make(100),
            });

            expect(calculateForgedTotal(crypto.CryptoManager, delegate)).toBe("110");
        });
    });
});
