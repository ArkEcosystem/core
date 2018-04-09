import Base from '@/api/base'

export default class Statistics extends Base {
  /**
   * [blockchain description]
   * @return {[type]} [description]
   */
  blockchain () {
    return this.http.get('statistics/blockchain')
  }

  /**
   * [transactions description]
   * @return {[type]} [description]
   */
  transactions () {
    return this.http.get('statistics/transactions')
  }

  /**
   * [blocks description]
   * @return {[type]} [description]
   */
  blocks () {
    return this.http.get('statistics/blocks')
  }

  /**
   * [votes description]
   * @return {[type]} [description]
   */
  votes () {
    return this.http.get('statistics/votes')
  }

  /**
   * [unvotes description]
   * @return {[type]} [description]
   */
  unvotes () {
    return this.http.get('statistics/unvotes')
  }
}
