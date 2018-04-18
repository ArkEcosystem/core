'use strict';

const queryFilter = require('../../../src/repositories/utils/filter-query')

describe('Query Filter', () => {
  it('should be a function', async () => {
    await expect(queryFilter).toBeFunction()
  })
})
