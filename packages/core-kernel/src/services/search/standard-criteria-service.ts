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
                // Array of criteria items constitute OR expression. For example:
                // [
                //   { type: Enums.TransactionType.DelegateRegistration },
                //   { type: Enums.TransactionType.Vote }
                // ]

                return criteria.some((criteriaItem, i) => {
                    try {
                        return this.testStandardCriteriaItem(value, criteriaItem);
                    } catch (error) {
                        if (error instanceof InvalidCriteria) {
                            throw new InvalidCriteria(error.value, error.criteria, [String(i), ...error.path]);
                        }

                        if (error instanceof UnsupportedValue) {
                            throw new UnsupportedValue(error.value, [String(i), ...error.path]);
                        }

                        if (error instanceof UnexpectedError) {
                            throw new UnexpectedError(error.error, [String(i), ...error.path]);
                        }

                        throw new UnexpectedError(error, [String(i), ...error.path]);
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

        // Narrowing `value` to `boolean` doesn't narrow `criteriaItem` to `StandardCriteriaOfItem<boolean>` :-(

        if (typeof value === "boolean") {
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
        // And criteria that is used:
        // { owners: ["alice", "charlie"] }
        //
        // If it's "alice AND charlie" then how to specify "alice OR charlie"?
        // If it's "alice OR charlie" then how to specify "alice AND charlie"?
        //
        // Thankfully there are no resources with array properties.

        throw new UnsupportedValue(value, []);
    }

    private testBooleanValueCriteriaItem(value: boolean, criteriaItem: StandardCriteriaOfItem<boolean>): boolean {
        // In most cases criteria is cast to the same type as value during validation (by @hapi/joi).
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

        if (typeof criteriaItem === "object" && criteriaItem !== null) {
            try {
                if ("from" in criteriaItem && "to" in criteriaItem) {
                    return bnValue.isGreaterThanEqual(criteriaItem.from) && bnValue.isLessThanEqual(criteriaItem.to);
                }

                if ("from" in criteriaItem) {
                    return bnValue.isGreaterThanEqual(criteriaItem.from);
                }

                if ("to" in criteriaItem) {
                    return bnValue.isGreaterThanEqual(criteriaItem.to);
                }
            } catch (error) {
                if ("from" in criteriaItem) {
                    try {
                        Utils.BigNumber.make(criteriaItem.from);
                    } catch (error) {
                        throw new InvalidCriteria(value, criteriaItem.from, ["from"]);
                    }
                }

                if ("to" in criteriaItem) {
                    try {
                        Utils.BigNumber.make(criteriaItem.to);
                    } catch (error) {
                        throw new InvalidCriteria(value, criteriaItem.to, ["to"]);
                    }
                }

                throw error;
            }
        }

        throw new InvalidCriteria(value, criteriaItem, []);
    }

    private testObjectValueCriteriaItem(value: object, criteriaItem: StandardCriteriaOfItem<object>): boolean {
        return Object.keys(criteriaItem).every((key) => {
            try {
                if (key === "*") {
                    return Object.values(value).some((v) => {
                        return this.testStandardCriterias(v, criteriaItem[key]);
                    });
                } else {
                    return this.testStandardCriterias(value[key], criteriaItem[key]);
                }
            } catch (error) {
                if (error instanceof InvalidCriteria) {
                    throw new InvalidCriteria(error.value, error.criteria, [key, ...error.path]);
                }

                if (error instanceof UnsupportedValue) {
                    throw new UnsupportedValue(error.value, [key, ...error.path]);
                }

                if (error instanceof UnexpectedError) {
                    throw new UnexpectedError(error.error, [key, ...error.path]);
                }

                throw new UnexpectedError(error, [key, ...error.path]);
            }
        });
    }
}
