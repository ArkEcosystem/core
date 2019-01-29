import { asValue, AwilixContainer } from "awilix";
import "jest-extended";

import { Container } from "../src/container";
import { EntryDoesNotExist, InvalidType } from "../src/errors";

class DummyClass {
    private ping;

    constructor({ ping }) {
        this.ping = ping;
    }

    public pong() {
        return this.ping;
    }
}

const dummyFunction = ({ ping }) => ping;

let container;
beforeEach(() => {
    container = new Container();
});

describe("Container", () => {
    describe("resolve", () => {
        it("should resolve the given name", () => {
            container.bind("name", "value");

            expect(container.resolve("name")).toBe("value");
        });

        it("should throw an exception if a registration cannot be resolved", () => {
            expect(() => {
                container.resolve("name");
            }).toThrowError(EntryDoesNotExist);
        });
    });

    describe("bind", () => {
        it("should be bound if it is a class", () => {
            container.bind("key", "value");

            expect(container.resolve("key")).toBe("value");
        });
    });

    describe("shared", () => {
        describe("class", () => {
            it("should be bound if it is a class", () => {
                container.shared("key", DummyClass);

                expect(container.has("key")).toBeTrue();
            });

            it("should not be bound if it is not a class", () => {
                expect(() => {
                    container.shared("key", "dummy-value");
                }).toThrowError(InvalidType);
            });
        });

        describe("function", () => {
            it("should be bound if it is a function", () => {
                container.shared("key", dummyFunction);

                expect(container.has("key")).toBeTrue();
            });

            it("should not be bound if it is not a function", () => {
                expect(() => {
                    container.shared("key", "dummy-value");
                }).toThrowError(InvalidType);
            });
        });
    });

    describe("alias", () => {
        it("should create an alias", () => {
            container.bind("name", "value");

            container.alias("name", "alias");

            expect(container.has("alias")).toBeTrue();
        });
    });

    describe("has", () => {
        it("should not be an alias", () => {
            expect(container.has("name")).toBeFalse();
        });

        it("should be an alias", () => {
            container.bind("name", "alias");

            expect(container.has("name")).toBeTrue();
        });
    });

    describe("call", () => {
        it("should create an instance", () => {
            container.bind("ping", "pong");

            expect(container.call(DummyClass).pong()).toBe("pong");
        });

        it("should call the function", () => {
            container.bind("ping", "pong");

            expect(container.call(dummyFunction)).toBe("pong");
        });
    });
});
