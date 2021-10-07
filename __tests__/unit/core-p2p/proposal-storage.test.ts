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

        it("should throw if proposal is added multiple times", () => {
            proposalStorage.boot();

            proposalStorage.addProposal({
                height: 1,
            });

            expect(() => {
                proposalStorage.addProposal({
                    height: 1,
                });
            }).toThrow();
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

    describe("getProposal", () => {
        it("should return added proposal", () => {
            proposalStorage.boot();

            const data = {
                height: 1,
            };

            proposalStorage.addProposal(data);

            expect(proposalStorage.getProposal(1)).toEqual(data);
        });

        it("should not find proposal", () => {
            proposalStorage.boot();

            expect(proposalStorage.getProposal(1)).toEqual(undefined);
        });
    });

    describe("removeProposal", () => {
        it("should remove proposal", () => {
            proposalStorage.boot();

            proposalStorage.addProposal({
                height: 1,
            });

            expect(proposalStorage.hasProposal(1)).toEqual(true);

            proposalStorage.removeProposal(1);

            expect(proposalStorage.hasProposal(1)).toEqual(false);
        });
    });
});
