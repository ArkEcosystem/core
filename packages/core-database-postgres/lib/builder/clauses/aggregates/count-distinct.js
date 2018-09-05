module.exports = function (column, alias) {
    return alias
      ? [`COUNT (DISTINCT "${column}") AS "${alias}"`]
      : [`COUNT (DISTINCT "${column}") AS "${column}"`]
}
