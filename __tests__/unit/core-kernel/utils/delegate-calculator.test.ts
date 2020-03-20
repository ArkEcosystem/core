import "jest-extended";

import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Managers, Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "@packages/core-kernel/src/utils/delegate-calculator";
import { Sandbox } from "@packages/core-test-framework/src";

let sandbox: Sandbox;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();

    sandbox.app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes).set("delegate");
    sandbox.app
        .get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes)
        .set("delegate.voteBalance");

    Managers.configManager.set("genesisBlock.totalAmount", 1000000 * 1e8);
});

const createWallet = (address: string): Contracts.State.Wallet =>
    new Wallets.Wallet(
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
                voteBalance: Utils.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly with default height 1", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(delegate)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(16500 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            const delegate = createWallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                forgedFees: Utils.BigNumber.make(10),
                forgedRewards: Utils.BigNumber.make(100),
            });

            expect(calculateForgedTotal(delegate)).toBe("110");
        });
    });
});
