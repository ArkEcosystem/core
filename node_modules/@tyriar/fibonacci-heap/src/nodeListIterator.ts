/**
 * @license
 * Copyright Daniel Imms <http://www.growingwiththeweb.com>
 * Released under MIT license. See LICENSE in the project root for details.
 */

import { Node } from './node';

export class NodeListIterator<K, V> {
  private _index: number;
  private _items: Node<K, V>[];

  /**
   * Creates an Iterator used to simplify the consolidate() method. It works by
   * making a shallow copy of the nodes in the root list and iterating over the
   * shallow copy instead of the source as the source will be modified.
   * @param start A node from the root list.
   */
  constructor(start: Node<K, V>) {
    this._index = -1;
    this._items = [];
    let current = start;
    do {
      this._items.push(current);
      current = current.next;
    } while (start !== current);
  }

  /**
   * @return Whether there is a next node in the iterator.
   */
  public hasNext(): boolean {
    return this._index < this._items.length - 1;
  }

  /**
   * @return The next node.
   */
  public next(): Node<K, V> {
    return this._items[++this._index];
  }
}
