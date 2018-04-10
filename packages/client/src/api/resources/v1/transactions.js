import Base from '@/api/base'

export default class Transactions extends Base {
  /**
   * [all description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  all (query) {
    return this.http.get('transactions', query)
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get('transactions/get', {id})
  }

  /**
   * [allUnconfirmed description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  allUnconfirmed (query) {
    return this.http.get('transactions/unconfirmed', query)
  }

  /**
   * [getUnconfirmed description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  getUnconfirmed (id) {
    return this.http.get('transactions/unconfirmed/get', {id})
  }
}
