const BetterSqlite3 = jest.requireActual("better-sqlite3");

module.exports = class BetterSqlite3Mock extends BetterSqlite3 {
    constructor(path, options = {}) {
        super(path || ":memory:", options);
    }
};
