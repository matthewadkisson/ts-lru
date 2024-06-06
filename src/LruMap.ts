/* @preserve
 * 
 * A doubly linked list-based Least Recently Used (LRU) cache. Will keep most
 * recently used items while discarding least recently used items when its limit
 * is reached.
 *
 * Licensed under MIT. Copyright (c) 2010 Rasmus Andersson <http://hunch.se/>
 * See README.md for details.
 *
 * Illustration of the design:
 *
 *       entry             entry             entry             entry
 *       ______            ______            ______            ______
 *      | head |.newer => |      |.newer => |      |.newer => | tail |
 *      |  A   |          |  B   |          |  C   |          |  D   |
 *      |______| <= older.|______| <= older.|______| <= older.|______|
 *
 *  removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
 */
const NEWER = Symbol('newer');
const OLDER = Symbol('older');
export class Entry<K, V> {
    key: K;
    value: V;
    [NEWER]: Entry<K, V> | undefined;
    [OLDER]: Entry<K, V> | undefined;
  
    constructor(key: K, value: V) {
      this.key = key;
      this.value = value;
      this[NEWER] = undefined;
      this[OLDER] = undefined;
    }
  }
  

  
  export class LRUMap<K, V> {
    private size: number;
    private limit: number;
    private oldest: Entry<K, V> | undefined;
    private newest: Entry<K, V> | undefined;
    private _keymap: Map<K, Entry<K, V>>;
  
    constructor(limit: number, entries?: Iterable<[K, V]>) {
      if (typeof limit !== 'number') {
        // called as (entries)
        entries = limit as Iterable<[K, V]>;
        limit = 0;
      }
  
      this.size = 0;
      this.limit = limit;
      this.oldest = undefined;
      this.newest = undefined;
      this._keymap = new Map();
  
      if (entries) {
        this.assign(entries);
        if (limit < 1) {
          this.limit = this.size;
        }
      }
    }
  
    private _markEntryAsUsed(entry: Entry<K, V>) {
      if (entry === this.newest) {
        // Already the most recenlty used entry, so no need to update the list
        return;
      }
      // HEAD--------------TAIL
      //   <.older   .newer>
      //  <--- add direction --
      //   A  B  C  <D>  E
      if (entry[NEWER]) {
        if (entry === this.oldest) {
          this.oldest = entry[NEWER];
        }
        entry[NEWER]![OLDER] = entry[OLDER]; // C <-- E.
      }
      if (entry[OLDER]) {
        entry[OLDER]![NEWER] = entry[NEWER]; // C. --> E
      }
      entry[NEWER] = undefined; // D --x
      entry[OLDER] = this.newest; // D. --> E
      if (this.newest) {
        this.newest[NEWER] = entry; // E. <-- D
      }
      this.newest = entry;
    }
  
    assign(entries: Iterable<[K, V]>) {
      let entry: Entry<K, V> | undefined, limit = this.limit || Number.MAX_VALUE;
      this._keymap.clear();
      let it = entries[Symbol.iterator]();
      for (let itv = it.next(); !itv.done; itv = it.next()) {
        let e = new Entry(itv.value[0], itv.value[1]);
        this._keymap.set(e.key, e);
        if (!entry) {
          this.oldest = e;
        } else {
          entry[NEWER] = e;
          e[OLDER] = entry;
        }
        entry = e;
        if (limit-- == 0) {
          throw new Error('overflow');
        }
      }
      this.newest = entry;
      this.size = this._keymap.size;
    }
  
    get(key: K): V | undefined {
      // First, find our cache entry
      var entry = this._keymap.get(key);
      if (!entry) return; // Not cached. Sorry.
      // As <key> was found in the cache, register it as being requested recently
      this._markEntryAsUsed(entry);
      return entry.value;
    }
  
    set(key: K, value: V): this {
      var entry = this._keymap.get(key);
  
      if (entry) {
        // update existing
        entry.value = value;
        this._markEntryAsUsed(entry);
        return this;
      }
  
      // new entry
      this._keymap.set(key, (entry = new Entry(key, value)));
  
      if (this.newest) {
        // link previous tail to the new tail (entry)
        this.newest[NEWER] = entry;
        entry[OLDER] = this.newest;
      } else {
        // we're first in -- yay
        this.oldest = entry;
      }
  
      // add new entry to the end of the linked list -- it's now the freshest entry.
      this.newest = entry;
      ++this.size;
      if (this.size > this.limit) {
        // we hit the limit -- remove the head
        this.shift();
      }
  
      return this;
    }
  
    shift(): [K, V] | undefined {
      // todo: handle special case when limit == 1
      var entry = this.oldest;
      if (entry) {
        if (this.oldest && this.oldest[NEWER]) {
          // advance the list
          this.oldest = this.oldest[NEWER];
          this.oldest[OLDER] = undefined;
        } else {
          // the cache is exhausted
          this.oldest = undefined;
          this.newest = undefined;
        }
        // Remove last strong reference to <entry> and remove links from the purged
        // entry being returned:
        entry[NEWER] = entry[OLDER] = undefined;
        this._keymap.delete(entry.key);
        --this.size;
        return [entry.key, entry.value];
      }
      return undefined;
    }
  
    // -------------------------------------------------------------------------------------
    // Following code (until end of class definition) is optional and can be removed without
    // breaking the core functionality.
  
    find(key: K): V | undefined {
      let e = this._keymap.get(key);
      return e ? e.value : undefined;
    }
  
    has(key: K): boolean {
      return this._keymap.has(key);
    }
  
    delete(key: K): V | undefined {
      var entry = this._keymap.get(key);
      if (!entry) return;
      this._keymap.delete(entry.key);
      if (entry[NEWER] && entry[OLDER]) {
        // relink the older entry with the newer entry
        entry[OLDER]![NEWER] = entry[NEWER];
        entry[NEWER]![OLDER] = entry[OLDER];
      } else if (entry[NEWER]) {
        // remove the link to us
        entry[NEWER]![OLDER] = undefined;
        // link the newer entry to head
        this.oldest = entry[NEWER];
      } else if (entry[OLDER]) {
        // remove the link to us
        entry[OLDER]![NEWER] = undefined;
        // link the newer entry to head
        this.newest = entry[OLDER];
      } else {// if(entry[OLDER] === undefined && entry.newer === undefined) {
        this.oldest = this.newest = undefined;
      }
  
      this.size--;
      return entry.value;
    }
  
    clear(): void {
      // Not clearing links should be safe, as we don't expose live links to user
      this.oldest = this.newest = undefined;
      this.size = 0;
      this._keymap.clear();
    }
  
    keys(): IterableIterator<K> {
      return new KeyIterator(this.oldest);
    }
  
    values(): IterableIterator<V> {
      return new ValueIterator(this.oldest);
    }
  
    entries(): Iterable<[K, V]> {
      return this;
    }
  
    [Symbol.iterator](): IterableIterator<[K, V]> {
      return new EntryIterator(this.oldest);
    }
  
    forEach(callback: (value: V, key: K, map: LRUMap<K, V>) => void, thisArg?: any): void {
      if (typeof thisArg !== 'object') {
        thisArg = this;
      }
      let entry = this.oldest;
      while (entry) {
        callback.call(thisArg, entry.value, entry.key, this);
        entry = entry[NEWER];
      }
    }
  
    /** Returns a JSON (array) representation */
    toJSON(): { key: K, value: V }[] {
      var s = new Array(this.size), i = 0, entry = this.oldest;
      while (entry) {
        s[i++] = { key: entry.key, value: entry.value };
        entry = entry[NEWER];
      }
      return s;
    }
  
    /** Returns a String representation */
    toString(): string {
      var s = '', entry = this.oldest;
      while (entry) {
        s += String(entry.key) + ':' + entry.value;
        entry = entry[NEWER];
        if (entry) {
          s += ' < ';
        }
      }
      return s;
    }
  }
  
  class EntryIterator<K, V> implements IterableIterator<[K, V]> {
    private entry: Entry<K, V> | undefined;
  
    constructor(oldestEntry: Entry<K, V> | undefined) {
      this.entry = oldestEntry;
    }
  
    [Symbol.iterator](): IterableIterator<[K, V]> {
      return this;
    }
  
    next(): IteratorResult<[K, V]> {
      let ent = this.entry;
      if (ent) {
        this.entry = ent[NEWER];
        return { done: false, value: [ent.key, ent.value] };
      } else {
        return { done: true, value: undefined as any };
      }
    }
  }
  
  class KeyIterator<K, V> implements IterableIterator<K> {
    private entry: Entry<K, V> | undefined;
  
    constructor(oldestEntry: Entry<K, V> | undefined) {
      this.entry = oldestEntry;
    }
  
    [Symbol.iterator](): IterableIterator<K> {
      return this;
    }
  
    next(): IteratorResult<K> {
      let ent = this.entry;
      if (ent) {
        this.entry = ent[NEWER];
        return { done: false, value: ent.key };
      } else {
        return { done: true, value: undefined as any };
      }
    }
  }
  
  class ValueIterator<K, V> implements IterableIterator<V> {
    private entry: Entry<K, V> | undefined;
  
    constructor(oldestEntry: Entry<K, V> | undefined) {
      this.entry = oldestEntry;
    }
  
    [Symbol.iterator](): IterableIterator<V> {
      return this;
    }
  
    next(): IteratorResult<V> {
      let ent = this.entry;
      if (ent) {
        this.entry = ent[NEWER];
        return { done: false, value: ent.value };
      } else {
        return { done: true, value: undefined as any };
      }
    }
  }