module.exports = {
  BLACKLISTED: {
    number: 12,
    period: 'hours',
    reason: 'Blacklisted',
    weight: 10
  },
  INVALID_VERSION: {
    number: 6,
    period: 'hours',
    reason: 'Invalid Version',
    weight: 7
  },
  INVALID_HEIGHT: {
    number: 10,
    period: 'minutes',
    reason: 'Node is not at height',
    weight: 5
  },
  INVALID_NETWORK: {
    number: 5,
    period: 'minutes',
    reason: 'Invalid Network',
    weight: 5
  },
  INVALID_STATUS: {
    number: 5,
    period: 'minutes',
    reason: 'Invalid Response Status',
    weight: 3
  },
  TIMEOUT: {
    number: 2,
    period: 'minutes',
    reason: 'Timeout',
    weight: 2
  },
  HIGH_LATENCY: {
    number: 1,
    period: 'minutes',
    reason: 'High Latency',
    weight: 1
  },
  BLOCKCHAIN_NOT_READY: {
    number: 30,
    period: 'seconds',
    reason: 'Blockchain not ready',
    weight: 0
  },
  UNKNOWN: {
    number: 30,
    period: 'minutes',
    reason: 'Unknown',
    weight: 5
  },
  REPEAT_OFFENDER: {
    number: 1,
    period: 'day',
    reason: 'Repeat Offender',
    weight: 100
  }
}
