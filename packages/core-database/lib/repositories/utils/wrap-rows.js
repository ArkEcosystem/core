'use strict'

/**
 * Wrap the rows to return the number of them too.
 * @param  {Array} rows
 * @return {Object}
 */
module.exports = rows => ({ count: rows.length, rows })
