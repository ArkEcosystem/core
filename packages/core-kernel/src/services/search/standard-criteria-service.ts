import { Utils } from "@arkecosystem/crypto";

import { StandardCriteriaOf, StandardCriteriaOfItem } from "../../contracts/search";
import { injectable } from "../../ioc";

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

                return criteria.some((criteriaItem) => this.testStandardCriteriaItem(value, criteriaItem));
            } else {
                return this.testStandardCriteriaItem(value, criteria);
            }
        });
    }

    public testStandardCriteriaItem<T>(value: T, criteriaItem: StandardCriteriaOfItem<T>): boolean {
        if (typeof value === "undefined") {
            return false;
        }

        // Narrowing `value` to `boolean` doesn't narrow `criteriaItem` to `StandardCriteriaOfItem<boolean>` :-(

        if (typeof value === "boolean") {
            return this.testBooleanCriteriaItem(value, criteriaItem as StandardCriteriaOfItem<boolean>);
        }

        if (typeof value === "string") {
            return this.testPatternCriteriaItem(value, criteriaItem as StandardCriteriaOfItem<string>);
        }

        if (typeof value === "number" || typeof value === "bigint" || value instanceof Utils.BigNumber) {
            return this.testRangeCriteriaItem(
                value,
                criteriaItem as StandardCriteriaOfItem<number | BigInt | Utils.BigNumber>,
            );
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            // doesn't narrow to `object`, nor excluding `symbol` does :-(
            return this.testObjectCriteriaItem(value as any, criteriaItem as StandardCriteriaOfItem<object>);
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

        throw new Error("Unsupported value");
    }

    public testBooleanCriteriaItem(value: boolean, criteriaItem: StandardCriteriaOfItem<boolean>): boolean {
        // In most cases criteria is cast to the same type as value during validation (by @hapi/joi).
        // Wallet's attributes property is an exception. There is currently now way to know what types may be there.
        // To test properties within it string values are also checked.
        // For example boolean `true` value is checked against boolean `true` and string `"true"`.

        if (value) {
            return criteriaItem === true || criteriaItem === "true";
        } else {
            return criteriaItem === false || criteriaItem === "false";
        }
    }

    public testPatternCriteriaItem(value: string, criteriaItem: StandardCriteriaOfItem<string>): boolean {
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

    public testRangeCriteriaItem(
        value: number | BigInt | Utils.BigNumber,
        criteriaItem: StandardCriteriaOfItem<number | BigInt | Utils.BigNumber>,
    ): boolean {
        if (typeof value === "number") {
            // delegate.production.approval is float

            if (typeof criteriaItem === "object" && criteriaItem !== null) {
                if ("from" in criteriaItem && "to" in criteriaItem) {
                    return value >= Number(criteriaItem["from"]) && value <= Number(criteriaItem["to"]);
                }

                if ("from" in criteriaItem) {
                    return value >= Number(criteriaItem["from"]);
                }

                if ("to" in criteriaItem) {
                    return value <= Number(criteriaItem["to"]);
                }

                throw new Error(`Unexpected range criteria`);
            } else {
                return value === Number(criteriaItem);
            }
        } else {
            // bigint or Utils.BigNumber
            const bigNumberValue = Utils.BigNumber.make(value);

            if (typeof criteriaItem === "object" && criteriaItem !== null) {
                if ("from" in criteriaItem && "to" in criteriaItem) {
                    return (
                        bigNumberValue.isGreaterThanEqual(Utils.BigNumber.make(criteriaItem["from"])) &&
                        bigNumberValue.isLessThanEqual(Utils.BigNumber.make(criteriaItem["to"]))
                    );
                }

                if ("from" in criteriaItem) {
                    return bigNumberValue.isGreaterThanEqual(Utils.BigNumber.make(criteriaItem["from"]));
                }

                if ("to" in criteriaItem) {
                    return bigNumberValue.isLessThanEqual(Utils.BigNumber.make(criteriaItem["to"]));
                }

                throw new Error(`Unexpected range criteria`);
            } else {
                return bigNumberValue.isEqualTo(Utils.BigNumber.make(criteriaItem));
            }
        }
    }

    public testObjectCriteriaItem(value: object, criteriaItem: StandardCriteriaOfItem<object>): boolean {
        return Object.keys(criteriaItem).every((key) => {
            if (key === "*") {
                return Object.values(value).some((v) => this.testStandardCriterias(v, criteriaItem[key]));
            } else {
                return this.testStandardCriterias(value[key], criteriaItem[key]);
            }
        });
    }
}
