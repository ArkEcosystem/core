const Sntp = jest.genMockFromModule('sntp')

const sntpTime = Sntp.time
Sntp.time = (options) => {
  if (options.host === 'notime.unknown.not') {
    // we actually want to call the real Sntp time() because we want it to fail
    return sntpTime(options)
  }
  return { t: 111 }
}

module.exports = Sntp
