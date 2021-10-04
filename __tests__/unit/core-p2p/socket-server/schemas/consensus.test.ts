import { consensusSchemas } from "@packages/core-p2p/src/socket-server/schemas/consensus";

describe("ConsensusSchema", () => {
    describe("createBlockProposal", () => {
        const request = {
            hash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
            height: 1,
            generatorPublicKey: "03b47f6b6719c76bad46a302d9cff7be9b1c2b2a20602a0d880f139b5b8901f068",
            signature:
                "3045022100ec71805b816b2c09ae7689bef633d3a59a24a3a7516e55255abba9ad69ba15650220583550dd2bb2d76ed2519c8395a41c2e0fbbb287ff02d73452365b41e19889af",
            timestamp: 1,
            payload: {},
        };

        it("should pass", () => {
            const result = consensusSchemas.createBlockProposal.validate(request);

            expect(result.error).toBeFalsy();
        });

        it("should br required", () => {
            const result = consensusSchemas.createBlockProposal.validate(undefined);

            expect(result.error).toBeTruthy();
            expect(result.error!.message).toEqual('"value" is required');
        });

        describe("hash", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.hash;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"hash" is required');
            });

            it("should be string", () => {
                const requestCopy = {
                    ...request,
                };
                // @ts-ignore
                requestCopy.hash = 123;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"hash" must be a string');
            });

            it("should be hex", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.hash = "g".repeat(64);

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"hash" must only contain hexadecimal characters');
            });

            it("should be of length 64", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.hash = "a";

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"hash" length must be 64 characters long');
            });
        });

        describe("height", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.height;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" is required');
            });

            it("should be number", () => {
                const requestCopy = {
                    ...request,
                };
                // @ts-ignore
                requestCopy.height = true;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be a number');
            });

            it("should be integer", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.height = 3.14;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be an integer');
            });

            it("should be positive", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.height = 0;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"height" must be a positive number');
            });
        });

        describe("generatorPublicKey", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.generatorPublicKey;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" is required');
            });

            it("should be string", () => {
                const requestCopy = {
                    ...request,
                };
                // @ts-ignore
                requestCopy.generatorPublicKey = 123;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" must be a string');
            });

            it("should be hex", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.generatorPublicKey = "g".repeat(66);

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" must only contain hexadecimal characters');
            });

            it("should be of length 66", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.generatorPublicKey = "a";

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"generatorPublicKey" length must be 66 characters long');
            });
        });

        describe("signature", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.signature;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" is required');
            });

            it("should be string", () => {
                const requestCopy = {
                    ...request,
                };
                // @ts-ignore
                requestCopy.signature = 123;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" must be a string');
            });

            it("should be hex", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.signature = "g".repeat(66);

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"signature" must only contain hexadecimal characters');
            });
        });

        describe("timestamp", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.timestamp;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" is required');
            });

            it("should be number", () => {
                const requestCopy = {
                    ...request,
                };
                // @ts-ignore
                requestCopy.timestamp = true;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be a number');
            });

            it("should be integer", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.timestamp = 3.14;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be an integer');
            });

            it("should be positive", () => {
                const requestCopy = {
                    ...request,
                };
                requestCopy.timestamp = 0;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"timestamp" must be a positive number');
            });
        });

        describe("payload", () => {
            it("should be required", () => {
                const requestCopy = {
                    ...request,
                };
                delete requestCopy.payload;

                const result = consensusSchemas.createBlockProposal.validate(requestCopy);

                expect(result.error).toBeTruthy();
                expect(result.error!.message).toEqual('"payload" is required');
            });
        });
    });
});
