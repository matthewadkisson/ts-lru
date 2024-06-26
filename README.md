A TypeScript implemenation of the lru_map package. 

[Original Project](https://github.com/rsms/js-lru)

# Least Recently Used (LRU) cache algorithm

A finite key-value map using the [Least Recently Used (LRU)](http://en.wikipedia.org/wiki/Cache_algorithms#Least_Recently_Used) algorithm, where the most recently-used items are "kept alive" while older, less-recently used items are evicted to make room for newer items.

Useful when you want to limit use of memory to only hold commonly-used things.

[![Test status](https://github.com/rsms/js-lru/workflows/npm-test/badge.svg)](https://github.com/rsms/js-lru/actions?query=workflow%3Anpm-test)


## Terminology & design

- Based on a doubly-linked list for low complexity random shuffling of entries.

- The cache object iself has a "head" (least recently used entry) and a
  "tail" (most recently used entry).

- The "oldest" and "newest" are list entries -- an entry might have a "newer" and
  an "older" entry (doubly-linked, "older" being close to "head" and "newer"
  being closer to "tail").

- Key lookup is done through a key-entry mapping native object, which on most
  platforms mean `O(1)` complexity. This comes at a very low memory cost  (for
  storing two extra pointers for each entry).

Fancy ASCII art illustration of the general design:

```txt
           entry             entry             entry             entry
           ______            ______            ______            ______
          | head |.newer => |      |.newer => |      |.newer => | tail |
.oldest = |  A   |          |  B   |          |  C   |          |  D   | = .newest
          |______| <= older.|______| <= older.|______| <= older.|______|

       removed  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  <--  added
```


## Example

```js
let c = new LRUMap(3)
c.set('adam',   29)
c.set('john',   26)
c.set('angela', 24)
c.toString()        // -> "adam:29 < john:26 < angela:24"
c.get('john')       // -> 26

// Now 'john' is the most recently used entry, since we just requested it
c.toString()        // -> "adam:29 < angela:24 < john:26"
c.set('zorro', 141) // -> {key:adam, value:29}

// Because we only have room for 3 entries, adding 'zorro' caused 'adam'
// to be removed in order to make room for the new entry
c.toString()        // -> "angela:24 < john:26 < zorro:141"
```


# Usage

**Using NPM:** [`npm install ts_lru_map`](https://www.npmjs.com/package/ts_lru_map) 

**Testing**:

- Run tests with `npm test`
- Run benchmarks with `npm run benchmark`



# API

The API imitates that of [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), which means that in most cases you can use `LRUMap` as a drop-in replacement for `Map`.

```ts
export class LRUMap<K,V> {
  // Construct a new cache object which will hold up to limit entries.
  // When the size == limit, a `put` operation will evict the oldest entry.
  //
  // If `entries` is provided, all entries are added to the new map.
  // `entries` should be an Array or other iterable object whose elements are
  // key-value pairs (2-element Arrays). Each key-value pair is added to the new Map.
  // null is treated as undefined.
  constructor(limit :number, entries? :Iterable<[K,V]>);

  // Current number of items
  size :number;

  // Maximum number of items this map can hold
  limit :number;

  // Least recently-used entry. Invalidated when map is modified.
  oldest :Entry<K,V>;

  // Most recently-used entry. Invalidated when map is modified.
  newest :Entry<K,V>;

  // Replace all values in this map with key-value pairs (2-element Arrays) from
  // provided iterable.
  assign(entries :Iterable<[K,V]>) : void;

  // Put <value> into the cache associated with <key>. Replaces any existing entry
  // with the same key. Returns `this`.
  set(key :K, value :V) : LRUMap<K,V>;

  // Purge the least recently used (oldest) entry from the cache.
  // Returns the removed entry or undefined if the cache was empty.
  shift() : [K,V] | undefined;

  // Get and register recent use of <key>.
  // Returns the value associated with <key> or undefined if not in cache.
  get(key :K) : V | undefined;

  // Check if there's a value for key in the cache without registering recent use.
  has(key :K) : boolean;

  // Access value for <key> without registering recent use. Useful if you do not
  // want to chage the state of the map, but only "peek" at it.
  // Returns the value associated with <key> if found, or undefined if not found.
  find(key :K) : V | undefined;

  // Remove entry <key> from cache and return its value.
  // Returns the removed value, or undefined if not found.
  delete(key :K) : V | undefined;

  // Removes all entries
  clear() : void;

  // Returns an iterator over all keys, starting with the oldest.
  keys() : Iterator<K>;

  // Returns an iterator over all values, starting with the oldest.
  values() : Iterator<V>;

  // Returns an iterable over all entries, starting with the oldest.
  entries() : Iterable<[K,V]>;

  // Returns an iterator over all entries, starting with the oldest.
  [Symbol.iterator]() : Iterator<[K,V]>;

  // Call `fun` for each entry, starting with the oldest entry.
  forEach(fun :(value :V, key :K, m :LRUMap<K,V>)=>void, thisArg? :any) : void;

  // Returns an object suitable for JSON encoding
  toJSON() : Array<{key :K, value :V}>;

  // Returns a human-readable text representation
  toString() : string;
}

// An entry holds the key and value, and pointers to any older and newer entries.
// Entries might hold references to adjacent entries in the internal linked-list.
// Therefore you should never store or modify Entry objects. Instead, reference the
// key and value of an entry when needed.
interface Entry<K,V> {
  key   :K;
  value :V;
}
```

If you need to perform any form of finalization of items as they are evicted from the cache, wrapping the `shift` method is a good way to do it:

```js
let c = new LRUMap(123);
c.shift = function() {
  let entry = LRUMap.prototype.shift.call(this);
  doSomethingWith(entry);
  return entry;
}
```

The internals calls `shift` as entries need to be evicted, so this method is guaranteed to be called for any item that's removed from the cache. The returned entry must not include any strong references to other entries. See note in the documentation of `LRUMap.prototype.set()`.

