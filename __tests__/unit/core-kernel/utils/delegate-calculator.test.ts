import "jest-extended";

import { app } from "@arkecosystem/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { AttributeService } from "@packages/core-kernel/src/services/attributes";
import { Wallet } from "@packages/core-state/src/wallets";
import { Managers, Utils } from "@arkecosystem/crypto";
import { calculateApproval, calculateForgedTotal } from "@packages/core-kernel/src/utils/delegate-calculator";

beforeAll(() => {
    // @fixme: we modify the real app instance instead of using a container and snapshot.
    // There are some context issues that result in "core-state" resolving a different container
    // then we initially specify in the test so those bindings would not be available.

    app.bind<AttributeService>(Identifiers.AttributeService)
        .to(AttributeService)
        .inSingletonScope();

    app.get<AttributeService>(Identifiers.AttributeService).set("wallet");

    app.get<AttributeService>(Identifiers.AttributeService)
        .get("wallet")
        .bind("delegate");

    app.get<AttributeService>(Identifiers.AttributeService)
        .get("wallet")
        .bind("delegate.voteBalance");

    Managers.configManager.set("genesisBlock.totalAmount", 1000000 * 1e8);
});

describe("Delegate Calculator", () => {
    describe("calculateApproval", () => {
        it("should calculate correctly with a height", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(10000 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1);
        });

        it("should calculate correctly with 2 decimals", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                voteBalance: Utils.BigNumber.make(16500 * 1e8),
            });

            expect(calculateApproval(delegate, 1)).toBe(1.65);
        });
    });

    describe("calculateForgedTotal", () => {
        it("should calculate correctly", () => {
            const delegate = new Wallet("D61xc3yoBQDitwjqUspMPx1ooET6r1XLt7");

            delegate.setAttribute("delegate", {
                producedBlocks: 0,
                forgedFees: Utils.BigNumber.make(10),
                forgedRewards: Utils.BigNumber.make(100),
            });

            expect(calculateForgedTotal(delegate)).toBe("110");
        });
    });
});
