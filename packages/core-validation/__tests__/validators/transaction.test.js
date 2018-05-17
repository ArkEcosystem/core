const transactionValidator = require('../../lib/validators/transaction')

// for (let k of transactionValidator) {
//   console.log(transactionValidator[k])
// }
console.log(transactionValidator.constructor)

describe('Validators - Transaction', () => {
  it('should be instantiated', () => {
    expect(transactionValidator.constructor.name).toBe('TransactionValidator')
  })

  it('should have validate function', () => {
    expect(transactionValidator.validate).toBeFunction()
  })
})

describe('Validators - Transaction - __validateTransfer', () => {
  it('should be function', () => {
    expect(transactionValidator.__validateTransfer).toBeFunction()
  })
})

describe('Validators - Transaction - __validateSignature', () => {
  it('should be function', () => {
    expect(transactionValidator.__validateSignature).toBeFunction()
  })
})

describe('Validators - Transaction - __validateDelegate', () => {
  it('should be function', () => {
    expect(transactionValidator.__validateDelegate).toBeFunction()
  })
})

describe('Validators - Transaction - __validateVote', () => {
  it('should be function', () => {
    expect(transactionValidator.__validateVote).toBeFunction()
  })
})
