import "jest-extended";

import { Container, Services } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";

import { Identifiers } from "@packages/core-kernel/src/ioc";
import { AttributeService } from "@packages/core-kernel/src/services/attributes";
import { Wallet } from "@packages/core-state/src/wallets";
import { Managers, Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "@packages/core-kernel/src/utils/delegate-calculator";

let sandbox: Sandbox;

beforeAll(() => {
    sandbox = new Sandbox();

    sandbox.app
        .bind<AttributeService>(Identifiers.AttributeService)
        .to(AttributeService)
        .inSingletonScope();

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

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7", sandbox.app);

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7", sandbox.app);

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(16500 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7", sandbox.app);

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                forgedFees: Utils.BigNumber.make(10),
                forgedRewards: Utils.BigNumber.make(100),
            });

            expect(calculateForgedTotal(delegate)).toBe("110");
        });
    });
});
