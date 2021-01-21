import { Utils } from "@arkecosystem/crypto";

import { StandardCriteriaOf, StandardCriteriaOfItem } from "../../contracts/search";
import { injectable } from "../../ioc";
import { InvalidCriteria, UnexpectedError, UnsupportedValue } from "./errors";

@injectable()
export class StandardCriteriaService {
    public testStandardCriterias<T>(value: T, ...criterias: StandardCriteriaOf<T>[]): boolean {
        return criterias.every((criteria) => {
            // Criteria is either single criteria item or array of criteria items.

            if (Array.isArray(criteria)) {
                // Array of criteria items constitute OR expression.
                //
                // Example:
                // [
                //   { type: Enums.TransactionType.DelegateRegistration },
                //   { type: Enums.TransactionType.Vote }
                // ]
                //
                // Alternatively (behaves same as above):
                // {
                //   type: [
                //     Enums.TransactionType.DelegateRegistration,
                //     Enums.TransactionType.Vote
                //   ]
                // }

                return criteria.some((criteriaItem, i) => {
                    try {
                        return this.testStandardCriteriaItem(value, criteriaItem);
                    } catch (error) {
                        this.rethrowError(error, String(i));
                    }
                });
            } else {
                return this.testStandardCriteriaItem(value, criteria);
            }
        });
    }

    private testStandardCriteriaItem<T>(value: T, criteriaItem: StandardCriteriaOfItem<T>): boolean {
        if (typeof value === "undefined" || value === null) {
            return false;
        }

        if (typeof value === "boolean") {
            // narrowing `value` to `boolean` doesn't narrow `criteriaItem` to `StandardCriteriaOfItem<boolean>` :-(
            return this.testBooleanValueCriteriaItem(value, criteriaItem as StandardCriteriaOfItem<boolean>);
        }

        if (typeof value === "string") {
            return this.testStringValueCriteriaItem(value, criteriaItem as StandardCriteriaOfItem<string>);
        }

        if (typeof value === "number") {
            return this.testNumberValueCriteriaItem(value, criteriaItem as StandardCriteriaOfItem<number>);
        }

        if (typeof value === "bigint" || value instanceof Utils.BigNumber) {
            return this.testBigNumberValueCriteriaItem(
                value,
                criteriaItem as StandardCriteriaOfItem<BigInt | Utils.BigNumber>,
            );
        }

        if (typeof value === "object" && !Array.isArray(value)) {
            // doesn't narrow to `object`, nor excluding `symbol` does :-(
            return this.testObjectValueCriteriaItem(value as any, criteriaItem as StandardCriteriaOfItem<object>);
        }

        // The only two other types left are:
        // `symbol` which is obviously not supported
        // `array` which is unfortunately not supported.
        //
        // Syntax for OR (array of criteria items) creates a conflict when testing array properties.
        //
        // Consider hypothetical resource that has array property:
        // { owners: ["alice", "bob", "charlie"] }
        //
        // Criteria that is used:
        // { owners: ["alice", "charlie"] }
        //
        // If it's "alice AND charlie" then how to specify "alice OR charlie"?
        // If it's "alice OR charlie" then how to specify "alice AND charlie"?
        //
        // Peer is the only resource with array property.

        throw new UnsupportedValue(value, []);
    }

    private testBooleanValueCriteriaItem(value: boolean, criteriaItem: StandardCriteriaOfItem<boolean>): boolean {
        // In most cases criteria is cast to the same type as value during validation (by joi).
        // Wallet's attributes property is an exception. There is currently now way to know what types may be there.
        // To test properties within it string values are also checked.
        // For example boolean `true` value is checked against boolean `true` and string `"true"`.

        if ([true, false, "true", "false"].includes(criteriaItem) === false) {
            throw new InvalidCriteria(value, criteriaItem, []);
        }

        if (value) {
            return criteriaItem === true || criteriaItem === "true";
        } else {
            return criteriaItem === false || criteriaItem === "false";
        }
    }

    private testStringValueCriteriaItem(value: string, criteriaItem: StandardCriteriaOfItem<string>): boolean {
        if (typeof criteriaItem !== "string") {
            throw new InvalidCriteria(value, criteriaItem, []);
        }

        if (criteriaItem.indexOf("%") === -1) {
            return criteriaItem === value;
        }

        // TODO: handle escape sequences (\%, \\, etc)

        let nextIndexFrom = 0;
        for (const part of criteriaItem.split("%")) {
            const index = value.indexOf(part, nextIndexFrom);
            if (index === -1) {
                return false;
            }
            nextIndexFrom = index + part.length;
        }
        return true;
    }

    private testNumberValueCriteriaItem(value: number, criteriaItem: StandardCriteriaOfItem<number>): boolean {
        if (typeof criteriaItem === "string" || typeof criteriaItem === "number") {
            if (isNaN(Number(criteriaItem))) {
                throw new InvalidCriteria(value, criteriaItem, []);
            }

            return value === Number(criteriaItem);
        }

        if (typeof criteriaItem === "object" && criteriaItem !== null) {
            if ("from" in criteriaItem) {
                if (isNaN(Number(criteriaItem["from"]))) {
                    throw new InvalidCriteria(value, criteriaItem.from, ["from"]);
                }
            }

            if ("to" in criteriaItem) {
                if (isNaN(Number(criteriaItem["to"]))) {
                    throw new InvalidCriteria(value, criteriaItem.to, ["to"]);
                }
            }

            if ("from" in criteriaItem && "to" in criteriaItem) {
                return value >= Number(criteriaItem["from"]) && value <= Number(criteriaItem["to"]);
            }

            if ("from" in criteriaItem) {
                return value >= Number(criteriaItem["from"]);
            }

            if ("to" in criteriaItem) {
                return value <= Number(criteriaItem["to"]);
            }
        }

        throw new InvalidCriteria(value, criteriaItem, []);
    }

    private testBigNumberValueCriteriaItem(
        value: BigInt | Utils.BigNumber,
        criteriaItem: StandardCriteriaOfItem<BigInt | Utils.BigNumber>,
    ): boolean {
        // Utils.BigNumber.make doesn't perform instanceof check
        const bnValue = value instanceof Utils.BigNumber ? value : Utils.BigNumber.make(value);

        if (
            typeof criteriaItem === "number" ||
            typeof criteriaItem === "string" ||
            typeof criteriaItem === "bigint" ||
            criteriaItem instanceof Utils.BigNumber
        ) {
            try {
                return bnValue.isEqualTo(criteriaItem);
            } catch (error) {
                throw new InvalidCriteria(value, criteriaItem, []);
            }
        }

        /* istanbul ignore else */
        if (typeof criteriaItem === "object" && criteriaItem !== null) {
            try {
                if ("from" in criteriaItem && "to" in criteriaItem) {
                    return bnValue.isGreaterThanEqual(criteriaItem.from) && bnValue.isLessThanEqual(criteriaItem.to);
                }

                if ("from" in criteriaItem) {
                    return bnValue.isGreaterThanEqual(criteriaItem.from);
                }

                if ("to" in criteriaItem) {
                    return bnValue.isLessThanEqual(criteriaItem.to);
                }
            } catch (error) {
                if ("from" in criteriaItem) {
                    try {
                        Utils.BigNumber.make(criteriaItem.from);
                    } catch (error) {
                        throw new InvalidCriteria(value, criteriaItem.from, ["from"]);
                    }
                }

                /* istanbul ignore else */
                if ("to" in criteriaItem) {
                    try {
                        Utils.BigNumber.make(criteriaItem.to);
                    } catch (error) {
                        throw new InvalidCriteria(value, criteriaItem.to, ["to"]);
                    }
                }

                // unreachable
                /* istanbul ignore next */
                throw error;
            }
        }

        throw new InvalidCriteria(value, criteriaItem, []);
    }

    private testObjectValueCriteriaItem(value: object, criteriaItem: StandardCriteriaOfItem<object>): boolean {
        const criteriaKeys = Object.keys(criteriaItem);

        if (criteriaKeys.length === 1 && criteriaKeys[0] === "*") {
            // Wildcard criteria that checks if any property matches
            //
            // Example:
            // {
            //   attributes: {
            //     htlc: {
            //       locks: {
            //         ["*"]: {
            //           secretHash: "03da05c1c1d4f9c6bda13695b2f29fbc65d9589edc070fc61fe97974be3e59c1"
            //         }
            //       }
            //     }
            //   }
            // }

            try {
                return Object.values(value).some((v) => {
                    return this.testStandardCriterias(v, criteriaItem["*"]);
                });
            } catch (error) {
                this.rethrowError(error, "*");
            }
        } else {
            return criteriaKeys.every((key) => {
                try {
                    return this.testStandardCriterias(value[key], criteriaItem[key]);
                } catch (error) {
                    this.rethrowError(error, key);
                }
            });
        }
    }

    private rethrowError(error: Error, key: string): never {
        if (error instanceof InvalidCriteria) {
            throw new InvalidCriteria(error.value, error.criteria, [key, ...error.path]);
        }

        if (error instanceof UnsupportedValue) {
            throw new UnsupportedValue(error.value, [key, ...error.path]);
        }

        if (error instanceof UnexpectedError) {
            throw new UnexpectedError(error.error, [key, ...error.path]);
        }

        throw new UnexpectedError(error, [key]);
    }
}
