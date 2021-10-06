import { consensusSchemas } from "@packages/core-p2p/src/socket-server/schemas/consensus";
import clonedeep from "lodash.clonedeep";

import { createBlockProposalRequest } from "../fixtures";

describe("ConsensusSchema", () => {
    describe("createBlockProposal", () => {
        let request;

        beforeEach(() => {
            request = clonedeep(createBlockProposalRequest);
        });

        it("should pass", () => {
            const result = consensusSchemas.createBlockProposal.validate(request);

            expect(result.error).toBeFalsy();
        });

        it("should br required", () => {
            const result = consensusSchemas.createBlockProposal.validate(undefined);

            expect(result.error).toBeTruthy();
            expect(result.error!.message).toEqual('"value" is required');
        });

        describe("blockHash", () => {
            it("should be required", () => {
                delete request.blockHash;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"blockHash" is required');
            });

            it("should be string", () => {
                request.blockHash = 123;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"blockHash" must be a string');
            });

            it("should be hex", () => {
                request.blockHash = "g".repeat(64);

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"blockHash" must only contain hexadecimal characters');
            });

            it("should be of length 64", () => {
                request.blockHash = "a";

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"blockHash" length must be 64 characters long');
            });
        });

        describe("height", () => {
            it("should be required", () => {
                delete request.height;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" is required');
            });

            it("should be number", () => {
                request.height = true;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be a number');
            });

            it("should be integer", () => {
                request.height = 3.14;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be an integer');
            });

            it("should be positive", () => {
                request.height = 0;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be a positive number');
            });
        });

        describe("generatorPublicKey", () => {
            it("should be required", () => {
                delete request.generatorPublicKey;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" is required');
            });

            it("should be string", () => {
                request.generatorPublicKey = 123;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" must be a string');
            });

            it("should be hex", () => {
                request.generatorPublicKey = "g".repeat(66);

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" must only contain hexadecimal characters');
            });

            it("should be of length 66", () => {
                request.generatorPublicKey = "a";

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" length must be 66 characters long');
            });
        });

        describe("signature", () => {
            it("should be required", () => {
                delete request.signature;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" is required');
            });

            it("should be string", () => {
                request.signature = 123;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" must be a string');
            });

            it("should be hex", () => {
                request.signature = "g".repeat(66);

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" must only contain hexadecimal characters');
            });
        });

        describe("timestamp", () => {
            it("should be required", () => {
                delete request.timestamp;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" is required');
            });

            it("should be number", () => {
                request.timestamp = true;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be a number');
            });

            it("should be integer", () => {
                request.timestamp = 3.14;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be an integer');
            });

            it("should be positive", () => {
                request.timestamp = 0;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be a positive number');
            });
        });

        describe("payload", () => {
            it("should be required", () => {
                delete request.payload;

                const result = consensusSchemas.createBlockProposal.validate(request);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"payload" is required');
            });

            // TODO: add tests for payload fields
        });
    });
});
