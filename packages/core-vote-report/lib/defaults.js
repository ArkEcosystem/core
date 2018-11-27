module.exports = {
  host: process.env.ARK_VOTE_REPORT_HOST || '0.0.0.0',
  port: process.env.ARK_VOTE_REPORT_PORT || 4006,
  delegateRows: process.env.ARK_VOTE_REPORT_DELEGATE_ROWS || 80,
}
