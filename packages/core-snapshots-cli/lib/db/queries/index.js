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
  transactionsExportString: (start, end) => {
    return `SELECT id, block_id, version, sequence, timestamp, sender_public_key, recipient_id, type, vendor_field_hex, amount, fee, serialized from TRANSACTIONS WHERE TIMESTAMP BETWEEN ${start} AND ${end} ORDER BY TIMESTAMP`
  },
  blocksExportString: (start, end) => {
    return `SELECT id, version, timestamp, previous_block, height, number_of_transactions, total_amount, total_fee, reward, payload_length, payload_hash, generator_public_key, block_signature FROM BLOCKS WHERE HEIGHT BETWEEN ${start} AND ${end} ORDER BY HEIGHT`
  },
  transactionsBackup: (start, end) => {
    return `SELECT id, sequence, serialized from TRANSACTIONS WHERE TIMESTAMP BETWEEN ${start} AND ${end} ORDER BY TIMESTAMP, sequence`
  }
}
