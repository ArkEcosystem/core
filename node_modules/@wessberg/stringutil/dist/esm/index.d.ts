interface ITruncateOptions {
    length: number;
    omission: string;
}
/**
 * Unquotes the given string - if it is quoted
 * @param {string} str
 * @returns {string}
 */
declare function unquote(str: string): string;
/**
 * Returns true if the string is in camelCase
 * @param {string} str
 * @returns {boolean}
 */
declare function isInCamelCase(str: string): boolean;
/**
 * Returns true if the string is in PascalCase
 * @param {string} str
 * @returns {boolean}
 */
declare function isInPascalCase(str: string): boolean;
/**
 * Returns true if the string is in kebab-case
 * @param {string} str
 * @returns {boolean}
 */
declare function isInKebabCase(str: string): boolean;
/**
 * Returns true if the string is in uppercase
 * @param {string} str
 * @returns {boolean}
 */
declare function isLowerCase(str: string): boolean;
/**
 * Returns true if the string is in uppercase
 * @param {string} str
 * @returns {boolean}
 */
declare function isUpperCase(str: string): boolean;
/**
 * Lowercases the first character of the string.
 * @param {string} str
 * @returns {string}
 */
declare function lowerCaseFirst(str: string): string;
/**
 * Uppercases the first character of the string.
 * @param {string} str
 * @returns {string}
 */
declare function upperCaseFirst(str: string): string;
/**
 * Returns true if the string is empty (has nothing but whitespace)
 * @param {string} str
 * @returns {boolean}
 */
declare function isEmpty(str: string): boolean;
/**
 * Returns true if the given string starts with a quote.
 * @param {string} str
 * @returns {boolean}
 */
declare function startsWithQuote(str: string): boolean;
/**
 * Returns true if the given string ends with a quote.
 * @param {string} str
 * @returns {boolean}
 */
declare function endsWithQuote(str: string): boolean;
/**
 * Returns true if the given string is quoted.
 * @param {string} str
 * @returns {boolean}
 */
declare function isQuoted(str: string): boolean;
/**
 * Returns all index matches of the provided Regular Expression on the provided string, optionally starting from a specific index.
 * @param {RegExp} regexp
 * @param {string} str
 * @param {number} [from=0]
 * @returns {number[]}
 */
declare function allIndexesOf(str: string, regexp: RegExp, from?: number): number[];
/**
 * Matches all occurrences of the given RegExp, including capture groups, globally. Supports both global RegExps and non-global RegExps
 * @param {string} str
 * @param {RegExp} regexp
 * @param {number} [from=0]
 * @returns {RegExpExecArray[]}
 */
declare function matchAll(str: string, regexp: RegExp, from?: number): RegExpExecArray[];
/**
 * Trims all of the provided strings.
 * @param {string[]} strings
 * @returns {string[]}
 */
declare function trimAll(strings: string[]): string[];
/**
 * camelCases the given string.
 * @param {string} str
 * @returns {string}
 */
declare function camelCase(str: string): string;
/**
 * PascalCases the given string.
 * @param {string} str
 * @returns {string}
 */
declare function pascalCase(str: string): string;
/**
 * Capitalizes the given string.
 * @param {string} str
 * @returns {string}
 */
declare function capitalize(str: string): string;
/**
 * kebab-cases (dash-cases) the given string.
 * @param {string} str
 * @returns {string}
 */
declare function kebabCase(str: string): string;
/**
 * Removes all whitespace from a string. If the second argument is truthy, it will preserve spaces.
 * @param {string} str
 * @param {boolean} [preserveSpaces=false]
 * @returns {string}
 */
declare function removeWhitespace(str: string, preserveSpaces?: boolean): string;
/**
 * Returns true if the given string contains whitespace
 * @param {string} str
 * @returns {boolean}
 */
declare function containsWhitespace(str: string): boolean;
/**
 * Returns true if the given string contains nothing but whitespace
 * @param {string} str
 * @returns {boolean}
 */
declare function containsOnlyWhitespace(str: string): boolean;
/**
 * Trims a string. It works like String.prototype.trim, except it also handles HTML spaces (&nbsp;).
 * @param {string} str
 * @returns {string}
 */
declare function trim(str: string): string;
/**
 * Replaces special characters like "æ" with "ae".
 * @param {string} str
 * @returns {string}
 */
declare function convertToAscii(str: string): string;
/**
 * Truncates the given text by the given max length and with the given omission character(s)
 * @param {string} text
 * @param {ITruncateOptions} [options]
 * @returns {string}
 */
declare function truncate(text: string, { length, omission }?: Partial<ITruncateOptions>): string;
export { unquote, isInCamelCase, isInPascalCase, isInKebabCase, isLowerCase, isUpperCase, lowerCaseFirst, upperCaseFirst, isEmpty, startsWithQuote, endsWithQuote, isQuoted, allIndexesOf, matchAll, trimAll, camelCase, pascalCase, capitalize, kebabCase, removeWhitespace, containsWhitespace, containsOnlyWhitespace, trim, convertToAscii, truncate, ITruncateOptions };
//# sourceMappingURL=index.d.ts.map