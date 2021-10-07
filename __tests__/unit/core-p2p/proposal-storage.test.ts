import { ProposalStorage } from "@packages/core-p2p/src/proposal-storage";
import { Sandbox } from "@packages/core-test-framework";

let sandbox: Sandbox;
let proposalStorage: ProposalStorage;

beforeEach(() => {
    sandbox = new Sandbox();

    proposalStorage = sandbox.app.resolve<ProposalStorage>(ProposalStorage);
});

describe("ProposalStorage", () => {
    describe("boot", () => {
        it("should initialize BetterSqlite3", () => {
            proposalStorage.boot();
        });
    });

    describe("addProposal", () => {
        it("should add proposal", () => {
            proposalStorage.boot();

            proposalStorage.addProposal({
                height: 1,
            });
        });
    });

    describe("hasProposal", () => {
        it("should find added proposal", () => {
            proposalStorage.boot();

            proposalStorage.addProposal({
                height: 1,
            });

            expect(proposalStorage.hasProposal(1)).toEqual(true);
        });

        it("should not find proposal", () => {
            proposalStorage.boot();

            expect(proposalStorage.hasProposal(1)).toEqual(false);
        });
    });
});
