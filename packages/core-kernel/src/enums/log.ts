/**
 * @remarks
 * Log levels as defined by {@link https://tools.ietf.org/html/rfc5424 | RFC 5424}
 *
 * @export
 * @enum {number}
 */
export enum LogLevel {
    Emergency = 0,
    Alert = 1,
    Critical = 2,
    Error = 3,
    Warning = 4,
    Notice = 5,
    Informational = 6,
    Debug = 7,
}
