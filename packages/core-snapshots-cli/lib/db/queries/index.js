const loadQueryFile = require('../utils/load-query-file')

module.exports = {
  blocks: {
    heightRange: loadQueryFile(__dirname, './blocks/height-range.sql'),
    latest: loadQueryFile(__dirname, './blocks/latest.sql'),
    findByHeight: loadQueryFile(__dirname, './blocks/find-by-height.sql'),
    deleteFromHeight: loadQueryFile(__dirname, './blocks/delete-from-height.sql')
  },
  transactions: {
    timestampRange: loadQueryFile(__dirname, './transactions/timestamp-range.sql'),
    deleteFromTimestamp: loadQueryFile(__dirname, './transactions/delete-from-timestamp.sql')
  },
  rounds: {
    deleteFromRound: loadQueryFile(__dirname, './rounds/delete-from-round.sql')
  },
  transactionsExport: (start, end) => {
    return `SELECT id, block_id, version, sequence, timestamp, sender_public_key, recipient_id, type, vendor_field_hex, amount, fee, serialized FROM transactions WHERE timestamp BETWEEN ${start} AND ${end} ORDER BY timestamp`
  },
  blocksExport: (start, end) => {
    return `SELECT id, version, timestamp, previous_block, height, number_of_transactions, total_amount, total_fee, reward, payload_length, payload_hash, generator_public_key, block_signature FROM blocks WHERE height BETWEEN ${start} AND ${end} ORDER BY height`
  },
  transactionsBackup: (start) => {
    return `SELECT id, sequence, serialized FROM transactions WHERE timestamp > ${start}`
  },
  truncateTable: (table) => {
    return `TRUNCATE TABLE ${table} RESTART IDENTITY`
  }
}
