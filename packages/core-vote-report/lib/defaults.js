module.exports = {
  host: process.env.PHANTOM_VOTE_REPORT_HOST || '0.0.0.0',
  port: process.env.PHANTOM_VOTE_REPORT_PORT || 4006,
  delegateRows: process.env.PHANTOM_VOTE_REPORT_DELEGATE_ROWS || 80,
}
