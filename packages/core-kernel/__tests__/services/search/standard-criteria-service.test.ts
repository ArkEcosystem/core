import { Container, Contracts } from "@packages/core-kernel";
import { InvalidCriteria, UnsupportedValue, UnexpectedError } from "@packages/core-kernel/src/services/search/errors";
import { StandardCriteriaService } from "@packages/core-kernel/src/services/search/standard-criteria-service";
import { Utils } from "@packages/crypto";

const container = new Container.Container();

const check = <T>(value: T, ...criterias: Contracts.Search.StandardCriteriaOf<T>[]): boolean => {
    return container.resolve(StandardCriteriaService).testStandardCriterias(value, ...criterias);
};

describe("StandardCriteriaService.testStandardCriterias", () => {
    it("should match every criteria argument", () => {
        expect(check(2, 2, "2")).toBe(true);
        expect(check(2, { from: 1 }, { to: 3 })).toBe(true);

        expect(check(2, 2, 3)).toBe(false);
        expect(check(2, { from: 1 }, { to: 1 })).toBe(false);
    });

    it("should match some criteria array item", () => {
        expect(check(2, [2, 3])).toBe(true);
        expect(check(2, [{ from: 1 }, { to: 1 }])).toBe(true);

        expect(check(2, [1, 3])).toBe(false);
        expect(check(2, [{ from: 3 }, { to: 1 }])).toBe(false);
    });

    describe("when value is boolean", () => {
        it("should check boolean criteria", () => {
            expect(check(true, true)).toBe(true);
            expect(check(false, false)).toBe(true);

            expect(check(true, false)).toBe(false);
            expect(check(false, true)).toBe(false);
        });

        it("should check boolean literal criteria", () => {
            expect(check(true, "true")).toBe(true);
            expect(check(false, "false")).toBe(true);

            expect(check(true, "false")).toBe(false);
            expect(check(false, "true")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(true, "NONSENSE")).toThrow("Invalid criteria 'NONSENSE' (string) for boolean value");
        });
    });

    describe("when value is string", () => {
        it("should check string criteria", () => {
            expect(check("John Doe", "John Doe")).toBe(true);

            expect(check("John Doe", "John")).toBe(false);
            expect(check("John Doe", "Doe")).toBe(false);
        });

        it("should check string pattern criteria", () => {
            expect(check("John Doe", "John %")).toBe(true);
            expect(check("John Doe", "John %oe")).toBe(true);
            expect(check("John Doe", "% Doe")).toBe(true);
            expect(check("John Doe", "%")).toBe(true);
            expect(check("John Doe", "J% D%")).toBe(true);

            expect(check("John Doe", "% doe")).toBe(false);
            expect(check("John Doe", "K% D%")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check("John Doe", 1 as any)).toThrow("Invalid criteria '1' (number) for string value");
        });
    });

    describe("when value is number", () => {
        it("should check exact number criteria", () => {
            expect(check(1, 1)).toBe(true);
            expect(check(1.1, 1.1)).toBe(true);

            expect(check(1, 2)).toBe(false);
            expect(check(1.1, 1.2)).toBe(false);
        });

        it("should check exact string criteria", () => {
            expect(check(1, "1")).toBe(true);
            expect(check(1.1, "1.1")).toBe(true);

            expect(check(1, "2")).toBe(false);
            expect(check(1.1, "1.2")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(1, "not a number")).toThrow("Invalid criteria 'not a number' (string) for number value");
            expect(() => check(1, NaN)).toThrow("Invalid criteria 'NaN' (number) for number value");
            expect(() => check(1, {} as any)).toThrow("Invalid criteria '[object Object]' (Object) for number value");
            expect(() => check(1, null as any)).toThrow("Invalid criteria 'null' for number value");
        });

        it("should check range number criteria", () => {
            expect(check(1, { from: 1 })).toBe(true);
            expect(check(1, { from: 0 })).toBe(true);
            expect(check(1, { to: 1 })).toBe(true);
            expect(check(1, { to: 2 })).toBe(true);
            expect(check(1, { from: 1, to: 1 })).toBe(true);
            expect(check(1, { from: 0, to: 2 })).toBe(true);

            expect(check(1, { from: 2 })).toBe(false);
            expect(check(1, { to: 0 })).toBe(false);
            expect(check(1, { from: 2, to: 3 })).toBe(false);
            expect(check(1, { from: -1, to: 0 })).toBe(false);
        });

        it("should check range string criteria", () => {
            expect(check(1, { from: "1" })).toBe(true);
            expect(check(1, { from: "0" })).toBe(true);
            expect(check(1, { to: "1" })).toBe(true);
            expect(check(1, { to: "2" })).toBe(true);
            expect(check(1, { from: "1", to: 1 })).toBe(true);
            expect(check(1, { from: 0, to: "2" })).toBe(true);

            expect(check(1, { from: "2" })).toBe(false);
            expect(check(1, { to: "0" })).toBe(false);
            expect(check(1, { from: "2", to: 3 })).toBe(false);
            expect(check(1, { from: -1, to: "0" })).toBe(false);
        });

        it("should throw when range criteria is invalid", () => {
            expect(() => check(1, { from: "a" })).toThrow("Invalid criteria 'a' (string) at 'from' for number value");
            expect(() => check(1, { to: "b" })).toThrow("Invalid criteria 'b' (string) at 'to' for number value");
        });
    });

    describe("when value is BigInt | Utils.BigNumber", () => {
        it("should check exact number criteria", () => {
            expect(check(BigInt(1), 1)).toBe(true);
            expect(check(Utils.BigNumber.make(1), 1)).toBe(true);

            expect(check(BigInt(1), 2)).toBe(false);
            expect(check(Utils.BigNumber.make(1), 2)).toBe(false);
        });

        it("should check exact BigInt criteria", () => {
            expect(check(Utils.BigNumber.make(1), BigInt(1))).toBe(true);
            expect(check(Utils.BigNumber.make(1), BigInt(2))).toBe(false);
        });

        it("should check exact Utils.BigNumber criteria", () => {
            expect(check(Utils.BigNumber.make(1), Utils.BigNumber.make(1))).toBe(true);
            expect(check(Utils.BigNumber.make(1), Utils.BigNumber.make(2))).toBe(false);
        });

        it("should check exact string criteria", () => {
            expect(check(Utils.BigNumber.make(1), "1")).toBe(true);
            expect(check(Utils.BigNumber.make(1), "2")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(Utils.BigNumber.make(1), "1.1")).toThrow(
                "Invalid criteria '1.1' (string) for BigNumber value",
            );

            expect(() => check(Utils.BigNumber.make(1), "a")).toThrow(
                "Invalid criteria 'a' (string) for BigNumber value",
            );

            expect(() => check(Utils.BigNumber.make(1), NaN)).toThrow(
                "Invalid criteria 'NaN' (number) for BigNumber value",
            );

            expect(() => check(Utils.BigNumber.make(1), {} as any)).toThrow(
                "Invalid criteria '[object Object]' (Object) for BigNumber value",
            );
        });

        it("should check range number criteria", () => {
            expect(check(Utils.BigNumber.make(1), { from: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 0 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: 2 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 1, to: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 0, to: 2 })).toBe(true);

            expect(check(Utils.BigNumber.make(1), { from: 2 })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { to: 0 })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: 2, to: Utils.BigNumber.make(3) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(-1), to: 0 })).toBe(false);
        });

        it("should check range BigInt criteria", () => {
            expect(check(Utils.BigNumber.make(1), { from: BigInt(1) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: BigInt(0) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: BigInt(1) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: BigInt(2) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: BigInt(1), to: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 0, to: BigInt(2) })).toBe(true);

            expect(check(Utils.BigNumber.make(1), { from: BigInt(2) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { to: BigInt(0) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: BigInt(2), to: Utils.BigNumber.make(3) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(-1), to: BigInt(0) })).toBe(false);
        });

        it("should check range Utils.BigNumber criteria", () => {
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(1) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(0) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: Utils.BigNumber.make(1) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: Utils.BigNumber.make(2) })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(1), to: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 0, to: Utils.BigNumber.make(2) })).toBe(true);

            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(2) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { to: Utils.BigNumber.make(0) })).toBe(false);

            expect(
                check(Utils.BigNumber.make(1), {
                    from: Utils.BigNumber.make(2),
                    to: Utils.BigNumber.make(3),
                }),
            ).toBe(false);

            expect(
                check(Utils.BigNumber.make(1), {
                    from: Utils.BigNumber.make(-1),
                    to: Utils.BigNumber.make(0),
                }),
            ).toBe(false);
        });

        it("should check range string criteria", () => {
            expect(check(Utils.BigNumber.make(1), { from: "1" })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: "0" })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: "1" })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { to: "2" })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: "1", to: 1 })).toBe(true);
            expect(check(Utils.BigNumber.make(1), { from: 0, to: "2" })).toBe(true);

            expect(check(Utils.BigNumber.make(1), { from: "2" })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { to: "0" })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: "2", to: Utils.BigNumber.make(3) })).toBe(false);
            expect(check(Utils.BigNumber.make(1), { from: Utils.BigNumber.make(-1), to: "0" })).toBe(false);
        });

        it("should throw when range criteria is invalid", () => {
            expect(() => check(Utils.BigNumber.make(1), { from: "a" })).toThrow(
                "Invalid criteria 'a' (string) at 'from' for BigNumber value",
            );

            expect(() => check(Utils.BigNumber.make(1), { to: "b" })).toThrow(
                "Invalid criteria 'b' (string) at 'to' for BigNumber value",
            );

            expect(() => check(Utils.BigNumber.make(1), { invalid: "criteria" } as any)).toThrow(
                "Invalid criteria '[object Object]' (Object) for BigNumber value",
            );
        });
    });

    describe("when value is object", () => {
        it("should check every criteria property", () => {
            const value = {
                a: 1,
                b: "hello world",
                c: {
                    d: Utils.BigNumber.make(5),
                },
            };

            expect(check(value, { a: 1, b: "hello world" })).toBe(true);
            expect(check(value, { a: 1, e: 5 } as any)).toBe(false);
            expect(check(value, { a: 1, c: { d: { from: 5 } } })).toBe(true);
            expect(check(value, { a: 1, c: { d: { from: 6 } } })).toBe(false);
        });

        it("should check every object property when criteria is wildcard", () => {
            const value = {
                owner: "alice",
                user: "bob",
            };

            expect(check(value, { "*": "alice" })).toBe(true);
            expect(check(value, { "*": "dave" })).toBe(false);
        });

        it("should re-throw error", () => {
            const value = {
                owner: "alice",
                user: "bob",
            };

            expect(() => check(value, { "*": [{}] })).toThrowError(
                "Invalid criteria '[object Object]' (Object) at '*.0' for string value",
            );
        });

        it("should re-throw error if called with multiple criteria", () => {
            const value = {
                owner: "alice",
                user: "bob",
            };

            // @ts-ignore
            expect(() => check(value, { user: 1, owner: "bob" })).toThrowError(
                "Invalid criteria '1' (number) at 'user' for string value",
            );
        });
    });

    describe("when value is array", () => {
        it("should throw an error", () => {
            expect(() => check([1, 2, 3], {} as any)).toThrowError("Unsupported value Array(3)");
        });
    });

    describe("examples", () => {
        const delegate = {
            username: "biz_classic",
            address: "AKdr5d9AMEnsKYxpDcoHdyyjSCKVx3r9Nj",
            publicKey: "020431436cf94f3c6a6ba566fe9e42678db8486590c732ca6c3803a10a86f50b92",
            votes: Utils.BigNumber.make("303991427568137"),
            rank: 2,
            isResigned: false,
            blocks: {
                produced: 242504,
                last: {
                    id: "0d51a4f17168766717cc9cbd83729a50913f7085b14c0c3fe774a020d4197688",
                    height: 13368988,
                    timestamp: {
                        epoch: 108163200,
                        human: "2020-08-24T10:20:00.000Z",
                        unix: 1598264400,
                    },
                },
            },
            production: {
                approval: 2.01,
            },
            forged: {
                fees: Utils.BigNumber.make("1173040419815"),
                rewards: Utils.BigNumber.make("48500800000000"),
                total: Utils.BigNumber.make("49673840419815"),
            },
        };

        it("should check delegate's username", () => {
            expect(check(delegate, { username: "biz_classic" })).toBe(true);
            expect(check(delegate, { username: "biz_%" })).toBe(true);
            expect(check(delegate, { username: "john" })).toBe(false);
        });

        it("should check delegate's username and rank", () => {
            expect(check(delegate, { username: "biz_classic", rank: { to: 10 } })).toBe(true);
            expect(check(delegate, { username: "biz_classic", rank: { from: 5 } })).toBe(false);
        });

        it("should check delegate's last produced block", () => {
            expect(check(delegate, { blocks: { last: { height: 13368988 } } })).toBe(true);
        });
    });

    describe("rethrowError", () => {
        let service;

        beforeEach(() => {
            service = container.resolve(StandardCriteriaService);
        });

        it("should throw InvalidCriteria", () => {
            const invalidCriteria = new InvalidCriteria("a", "b", ["original_key"]);

            expect(() => {
                service.rethrowError(invalidCriteria, "key");
            }).toThrowError("Invalid criteria 'b' (string) at 'key.original_key' for string value");
        });

        it("should throw UnsupportedValue", () => {
            const unsupportedValue = new UnsupportedValue("a", ["original_key"]);

            expect(() => {
                service.rethrowError(unsupportedValue, "key");
            }).toThrowError("Unsupported value 'a' (string) at 'key.original_key'");
        });

        it("should throw UnexpectedError", () => {
            const unexpectedError = new UnexpectedError(new Error("test"), ["original_key"]);

            expect(() => {
                service.rethrowError(unexpectedError, "key");
            }).toThrowError("Unexpected error 'test' (Error) at 'key.original_key'");
        });

        it("should throw UnexpectedError from error", () => {
            expect(() => {
                service.rethrowError(new Error("test"), "key");
            }).toThrowError("Unexpected error 'test' (Error) at 'key'");
        });
    });
});
