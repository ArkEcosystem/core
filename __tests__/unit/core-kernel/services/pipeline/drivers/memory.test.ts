import "jest-extended";

import { Application, Container, Contracts } from "@packages/core-kernel/src";
import { MemoryPipeline } from "@packages/core-kernel/src/services/pipeline/drivers/memory";

let app: Application;
let pipeline: Contracts.Kernel.Pipeline;
beforeEach(() => {
    app = new Application(new Container.Container());

    pipeline = new MemoryPipeline();
});

describe("Pipeline", () => {
    describe("Class", () => {
        describe("instantiated", () => {
            it("should apply all stages (async)", async () => {
                class RemoveDash implements Contracts.Kernel.Stage {
                    async process(payload: string) {
                        return payload.replace("_", "");
                    }
                }

                class RemoveUnderscore implements Contracts.Kernel.Stage {
                    async process(payload: string) {
                        return payload.replace("-", " ");
                    }
                }

                const actual: string = await pipeline
                    .pipe(new RemoveDash())
                    .pipe(new RemoveUnderscore())
                    .process("_Hello-World");

                expect(actual).toBe("Hello World");
            });

            it("should apply all stages (sync)", () => {
                class RemoveDash implements Contracts.Kernel.Stage {
                    process(payload: string) {
                        return payload.replace("_", "");
                    }
                }

                class RemoveUnderscore implements Contracts.Kernel.Stage {
                    process(payload: string) {
                        return payload.replace("-", " ");
                    }
                }

                const actual: string = pipeline
                    .pipe(new RemoveDash())
                    .pipe(new RemoveUnderscore())
                    .processSync("_Hello-World");

                expect(actual).toBe("Hello World");
            });
        });

        describe("resolved", () => {
            it("should apply all stages (async)", async () => {
                @Container.injectable()
                class RemoveDash implements Contracts.Kernel.Stage {
                    async process(payload: string) {
                        return payload.replace("_", "");
                    }
                }

                @Container.injectable()
                class RemoveUnderscore implements Contracts.Kernel.Stage {
                    async process(payload: string) {
                        return payload.replace("-", " ");
                    }
                }

                const actual: string = await pipeline
                    .pipe(app.resolve(RemoveDash))
                    .pipe(app.resolve(RemoveUnderscore))
                    .process("_Hello-World");

                expect(actual).toBe("Hello World");
            });

            it("should apply all stages (sync)", () => {
                @Container.injectable()
                class RemoveDash implements Contracts.Kernel.Stage {
                    process(payload: string) {
                        return payload.replace("_", "");
                    }
                }

                @Container.injectable()
                class RemoveUnderscore implements Contracts.Kernel.Stage {
                    process(payload: string) {
                        return payload.replace("-", " ");
                    }
                }

                const actual: string = pipeline
                    .pipe(app.resolve(RemoveDash))
                    .pipe(app.resolve(RemoveUnderscore))
                    .processSync("_Hello-World");

                expect(actual).toBe("Hello World");
            });
        });
    });

    describe("Function", () => {
        it("should apply all stages (async)", async () => {
            const removeDash = async (payload: string) => payload.replace("_", "");
            const removeUnderscore = async (payload: string) => payload.replace("-", " ");

            const actual: string = await pipeline.pipe(removeDash).pipe(removeUnderscore).process("_Hello-World");

            expect(actual).toBe("Hello World");
        });

        it("should apply all stages (sync)", () => {
            const removeDash = (payload: string) => payload.replace("_", "");
            const removeUnderscore = (payload: string) => payload.replace("-", " ");

            const actual: string = pipeline.pipe(removeDash).pipe(removeUnderscore).processSync("_Hello-World");

            expect(actual).toBe("Hello World");
        });
    });
});
