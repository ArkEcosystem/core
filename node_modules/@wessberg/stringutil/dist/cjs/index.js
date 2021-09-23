'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Unquotes the given string - if it is quoted
 * @param {string} str
 * @returns {string}
 */
function unquote(str) {
    return isQuoted(str) ? str.slice(1, str.length - 1) : str;
}
/**
 * Returns true if the string is in camelCase
 * @param {string} str
 * @returns {boolean}
 */
function isInCamelCase(str) {
    return camelCase(str) === str;
}
/**
 * Returns true if the string is in PascalCase
 * @param {string} str
 * @returns {boolean}
 */
function isInPascalCase(str) {
    return pascalCase(str) === str;
}
/**
 * Returns true if the string is in kebab-case
 * @param {string} str
 * @returns {boolean}
 */
function isInKebabCase(str) {
    return kebabCase(str) === str;
}
/**
 * Returns true if the string is in uppercase
 * @param {string} str
 * @returns {boolean}
 */
function isLowerCase(str) {
    return str.toLowerCase() === str;
}
/**
 * Returns true if the string is in uppercase
 * @param {string} str
 * @returns {boolean}
 */
function isUpperCase(str) {
    return str.toUpperCase() === str;
}
/**
 * Lowercases the first character of the string.
 * @param {string} str
 * @returns {string}
 */
function lowerCaseFirst(str) {
    if (str.length < 2)
        return str.toLowerCase();
    const head = str.slice(0, 1);
    const tail = str.slice(1);
    return `${head.toLowerCase()}${tail}`;
}
/**
 * Uppercases the first character of the string.
 * @param {string} str
 * @returns {string}
 */
function upperCaseFirst(str) {
    if (str.length < 2)
        return str.toUpperCase();
    const head = str.slice(0, 1);
    const tail = str.slice(1);
    return `${head.toUpperCase()}${tail}`;
}
/**
 * Returns true if the string is empty (has nothing but whitespace)
 * @param {string} str
 * @returns {boolean}
 */
function isEmpty(str) {
    return trim(str).length === 0;
}
/**
 * Returns true if the given string starts with a quote.
 * @param {string} str
 * @returns {boolean}
 */
function startsWithQuote(str) {
    return str.startsWith(`"`) || str.startsWith(`'`) || str.startsWith("`");
}
/**
 * Returns true if the given string ends with a quote.
 * @param {string} str
 * @returns {boolean}
 */
function endsWithQuote(str) {
    return str.endsWith(`"`) || str.endsWith(`'`) || str.endsWith("`");
}
/**
 * Returns true if the given string is quoted.
 * @param {string} str
 * @returns {boolean}
 */
function isQuoted(str) {
    const trimmed = removeWhitespace(str, true);
    return startsWithQuote(trimmed) && endsWithQuote(trimmed);
}
/**
 * Returns all index matches of the provided Regular Expression on the provided string, optionally starting from a specific index.
 * @param {RegExp} regexp
 * @param {string} str
 * @param {number} [from=0]
 * @returns {number[]}
 */
function allIndexesOf(str, regexp, from = 0) {
    return matchAll(str, regexp, from).map(match => match.index);
}
/**
 * Matches all occurrences of the given RegExp, including capture groups, globally. Supports both global RegExps and non-global RegExps
 * @param {string} str
 * @param {RegExp} regexp
 * @param {number} [from=0]
 * @returns {RegExpExecArray[]}
 */
function matchAll(str, regexp, from = 0) {
    let flags = regexp.flags;
    if (!flags.includes("g")) {
        flags += "g";
    }
    // Normalize the regular expression and make sure it *does* include the Global ('g') flag
    const normalizedRegExp = new RegExp(regexp, flags);
    const matches = [];
    while (true) {
        const match = normalizedRegExp.exec(str);
        if (match == null)
            break;
        if (match.index >= from) {
            matches.push(match);
        }
    }
    return matches;
}
/**
 * Trims all of the provided strings.
 * @param {string[]} strings
 * @returns {string[]}
 */
function trimAll(strings) {
    return strings.map(str => trim(str));
}
/**
 * camelCases the given string.
 * @param {string} str
 * @returns {string}
 */
function camelCase(str) {
    return lowerCaseFirst(str
        // Replaces any - or _ characters with a space
        .replace(/[-_+]+/g, " ").replace(/[ ]{2,}/g, " ")
        // Removes any non alphanumeric characters
        .replace(/[^\w\sa-zæøåàáäâëêéèïîíìöòóôüúùû&]/gi, "").replace(/[A-Z]{2,}/g, $1 => $1.toLowerCase())
        // Uppercases the first character in each group immediately following a space
        // (delimited by spaces)
        .replace(/ (.)/g, $1 => $1.toUpperCase())
        // Removes spaces
        .replace(/ /g, ""));
}
/**
 * PascalCases the given string.
 * @param {string} str
 * @returns {string}
 */
function pascalCase(str) {
    return capitalize(camelCase(str));
}
/**
 * Capitalizes the given string.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}
/**
 * kebab-cases (dash-cases) the given string.
 * @param {string} str
 * @returns {string}
 */
function kebabCase(str) {
    // Lower cases the string
    let _str = str;
    if (!/[a-zæøåàáäâëêéèïîíìöòóôüúùû]/.test(_str))
        _str = str.toLowerCase();
    return _str.replace(/(?:_)[A-ZÅÀÁÂÄÆËÊÉÈÏÎÍÌÖÔÒÓØÜÛÚÙ]{2,}|[A-Z]{2,}(?=_)/g, $1 => ` ${$1.toLowerCase()}`).replace(/[-_+]/g, " ").replace(/[ \t\r]*[A-ZÅÀÁÂÄÆËÊÉÈÏÎÍÌÖÔÒÓØÜÛÚÙ]+[ \t\r]+/g, $1 => ` ${$1.toLowerCase()} `).replace(/[A-ZÅÀÁÂÄÆËÊÉÈÏÎÍÌÖÔÒÓØÜÛÚÙ]/g, $1 => ` ${$1.toLowerCase()}`).replace(/^[ \t\r]+/g, "").replace(/\s{2,}/g, " ").replace(/\s+/g, "-");
}
/**
 * Removes all whitespace from a string. If the second argument is truthy, it will preserve spaces.
 * @param {string} str
 * @param {boolean} [preserveSpaces=false]
 * @returns {string}
 */
function removeWhitespace(str, preserveSpaces = false) {
    // Convert tabs to spaces and remove anything but spaces.
    if (preserveSpaces) {
        return str
            .replace(/&nbsp;/g, " ")
            .replace(/[\t]/g, " ")
            .replace(/[\n\r]/g, "")
            .replace(/[ ]{2,}/g, " ");
    }
    // Remove any kind of whitespace.
    return str
        .replace(/[ \n\t\r]/g, "")
        .replace(/&nbsp;/, "");
}
/**
 * Returns true if the given string contains whitespace
 * @param {string} str
 * @returns {boolean}
 */
function containsWhitespace(str) {
    return str.length !== removeWhitespace(str).length;
}
/**
 * Returns true if the given string contains nothing but whitespace
 * @param {string} str
 * @returns {boolean}
 */
function containsOnlyWhitespace(str) {
    return removeWhitespace(str).length === 0;
}
/**
 * Trims a string. It works like String.prototype.trim, except it also handles HTML spaces (&nbsp;).
 * @param {string} str
 * @returns {string}
 */
function trim(str) {
    let local = str.trim();
    while (local.startsWith("&nbsp;")) {
        local = local.slice("&nbsp;".length);
        local = local.trim();
    }
    while (local.endsWith("&nbsp;")) {
        local = local.slice(0, local.length - "&nbsp;".length);
        local = local.trim();
    }
    return local;
}
/**
 * Replaces special characters like "æ" with "ae".
 * @param {string} str
 * @returns {string}
 */
function convertToAscii(str) {
    return str
        .replace(/ /g, "-")
        .replace(/_/g, "-")
        .replace(/[àáâäãą]/g, "a")
        .replace(/[èéêëę]/g, "e")
        .replace(/[ìíîïı]/g, "i")
        .replace(/[òóôõöőð]/g, "o")
        .replace(/[ùúûüŭů]/g, "u")
        .replace(/[çćčĉ]/g, "c")
        .replace(/[çćčĉ]/g, "c")
        .replace(/[żźž]/g, "z")
        .replace(/[śşšŝ]/g, "s")
        .replace(/[ñń]/g, "n")
        .replace(/[ýÿ]/g, "y")
        .replace(/[ğĝ]/g, "g")
        .replace(/ß/g, "ss")
        .replace(/æ/g, "ae")
        .replace(/ø/g, "oe")
        .replace(/å/g, "aa")
        // Remove all other unicode characters
        .replace(/[^\x00-\x7F]/g, "");
}
/**
 * Truncates the given text by the given max length and with the given omission character(s)
 * @param {string} text
 * @param {ITruncateOptions} [options]
 * @returns {string}
 */
function truncate(text, { length = 30, omission = "..." } = {}) {
    if (text.length <= length)
        return text;
    return `${text.slice(0, (length - (omission.length)))}${omission}`;
}

exports.allIndexesOf = allIndexesOf;
exports.camelCase = camelCase;
exports.capitalize = capitalize;
exports.containsOnlyWhitespace = containsOnlyWhitespace;
exports.containsWhitespace = containsWhitespace;
exports.convertToAscii = convertToAscii;
exports.endsWithQuote = endsWithQuote;
exports.isEmpty = isEmpty;
exports.isInCamelCase = isInCamelCase;
exports.isInKebabCase = isInKebabCase;
exports.isInPascalCase = isInPascalCase;
exports.isLowerCase = isLowerCase;
exports.isQuoted = isQuoted;
exports.isUpperCase = isUpperCase;
exports.kebabCase = kebabCase;
exports.lowerCaseFirst = lowerCaseFirst;
exports.matchAll = matchAll;
exports.pascalCase = pascalCase;
exports.removeWhitespace = removeWhitespace;
exports.startsWithQuote = startsWithQuote;
exports.trim = trim;
exports.trimAll = trimAll;
exports.truncate = truncate;
exports.unquote = unquote;
exports.upperCaseFirst = upperCaseFirst;
//# sourceMappingURL=index.js.map
