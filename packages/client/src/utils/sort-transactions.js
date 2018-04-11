/**
 * [description]
 * @param  {[type]} transactions [description]
 * @return {[type]}              [description]
 */
module.exports = (transactions) => {
  // Map to create a new array (sort is done in place)
  // TODO does it matter modifying the order of the original array
  return transactions.map(t => t).sort((a, b) => {
    if (a.type < b.type) return -1
    if (a.type > b.type) return 1

    if (a.id < b.id) return -1
    if (a.id > b.id) return 1

    return 0
  })
}
