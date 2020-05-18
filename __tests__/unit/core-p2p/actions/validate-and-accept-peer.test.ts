import { ValidateAndAcceptPeerAction } from "@arkecosystem/core-p2p/src/actions/validate-and-accept-peer";

describe("ValidateAndAcceptPeerAction", () => {
    let validateAndAcceptPeerAction: ValidateAndAcceptPeerAction;

    const peerProcessor = { validateAndAcceptPeer: jest.fn() };
    const app = { get: () => peerProcessor };

    beforeEach(() => {
        validateAndAcceptPeerAction = new ValidateAndAcceptPeerAction(app as any);
    });

    describe("execute", () => {
        it("should call peerProcessor.validateAndAcceptPeer with arguments provided", async () => {
            const peer = { ip: "187.165.33.2", port: 4000 };
            const options = { someParam: 1 };
            await validateAndAcceptPeerAction.execute({ peer, options });

            expect(peerProcessor.validateAndAcceptPeer).toBeCalledTimes(1);
            expect(peerProcessor.validateAndAcceptPeer).toBeCalledWith(peer, options);
        });
    });
});
