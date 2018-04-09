import Base from '@/api/base'

export default class Wallets extends Base {
  /**
   * [all description]
   * @return {[type]} [description]
   */
  all () {
    return this.http.get('wallets')
  }

  /**
   * [top description]
   * @return {[type]} [description]
   */
  top () {
    return this.http.get('wallets/top')
  }

  /**
   * [get description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  get (id) {
    return this.http.get(`wallets/${id}`)
  }

  /**
   * [transactions description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  transactions (id) {
    return this.http.get(`wallets/${id}/transactions`)
  }

  /**
   * [transactionsSent description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  transactionsSent (id) {
    return this.http.get(`wallets/${id}/transactions/sent`)
  }

  /**
   * [transactionsReceived description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  transactionsReceived (id) {
    return this.http.get(`wallets/${id}/transactions/received`)
  }

  /**
   * [votes description]
   * @param  {String} id [description]
   * @return {[type]}    [description]
   */
  votes (id) {
    return this.http.get(`wallets/${id}/votes`)
  }

  /**
   * [search description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  search (payload) {
    return this.http.post('wallets/search', payload)
  }
}
