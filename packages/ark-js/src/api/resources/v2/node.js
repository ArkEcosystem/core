import Base from '@/api/base'

export default class Node extends Base {
  /**
   * [status description]
   * @return {[type]} [description]
   */
  status () {
    return this.http.get('node/status')
  }

  /**
   * [syncing description]
   * @return {[type]} [description]
   */
  syncing () {
    return this.http.get('node/syncing')
  }

  /**
   * [configuration description]
   * @return {[type]} [description]
   */
  configuration () {
    return this.http.get('node/configuration')
  }
}
