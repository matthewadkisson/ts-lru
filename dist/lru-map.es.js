var d = Object.defineProperty;
var y = (l, e, t) => e in l ? d(l, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : l[e] = t;
var h = (l, e, t) => (y(l, typeof e != "symbol" ? e + "" : e, t), t);
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
const s = Symbol("newer"), r = Symbol("older");
var k, m;
class u {
  constructor(e, t) {
    h(this, "key");
    h(this, "value");
    h(this, k);
    h(this, m);
    this.key = e, this.value = t, this[s] = void 0, this[r] = void 0;
  }
}
k = s, m = r;
class p {
  constructor(e, t) {
    h(this, "size");
    h(this, "limit");
    h(this, "oldest");
    h(this, "newest");
    h(this, "_keymap");
    typeof e != "number" && (t = e, e = 0), this.size = 0, this.limit = e, this.oldest = void 0, this.newest = void 0, this._keymap = /* @__PURE__ */ new Map(), t && (this.assign(t), e < 1 && (this.limit = this.size));
  }
  _markEntryAsUsed(e) {
    e !== this.newest && (e[s] && (e === this.oldest && (this.oldest = e[s]), e[s][r] = e[r]), e[r] && (e[r][s] = e[s]), e[s] = void 0, e[r] = this.newest, this.newest && (this.newest[s] = e), this.newest = e);
  }
  assign(e) {
    let t, i = this.limit || Number.MAX_VALUE;
    this._keymap.clear();
    let a = e[Symbol.iterator]();
    for (let o = a.next(); !o.done; o = a.next()) {
      let n = new u(o.value[0], o.value[1]);
      if (this._keymap.set(n.key, n), t ? (t[s] = n, n[r] = t) : this.oldest = n, t = n, i-- == 0)
        throw new Error("overflow");
    }
    this.newest = t, this.size = this._keymap.size;
  }
  get(e) {
    var t = this._keymap.get(e);
    if (t)
      return this._markEntryAsUsed(t), t.value;
  }
  set(e, t) {
    var i = this._keymap.get(e);
    return i ? (i.value = t, this._markEntryAsUsed(i), this) : (this._keymap.set(e, i = new u(e, t)), this.newest ? (this.newest[s] = i, i[r] = this.newest) : this.oldest = i, this.newest = i, ++this.size, this.size > this.limit && this.shift(), this);
  }
  shift() {
    var e = this.oldest;
    if (e)
      return this.oldest && this.oldest[s] ? (this.oldest = this.oldest[s], this.oldest[r] = void 0) : (this.oldest = void 0, this.newest = void 0), e[s] = e[r] = void 0, this._keymap.delete(e.key), --this.size, [e.key, e.value];
  }
  // -------------------------------------------------------------------------------------
  // Following code (until end of class definition) is optional and can be removed without
  // breaking the core functionality.
  find(e) {
    let t = this._keymap.get(e);
    return t ? t.value : void 0;
  }
  has(e) {
    return this._keymap.has(e);
  }
  delete(e) {
    var t = this._keymap.get(e);
    if (t)
      return this._keymap.delete(t.key), t[s] && t[r] ? (t[r][s] = t[s], t[s][r] = t[r]) : t[s] ? (t[s][r] = void 0, this.oldest = t[s]) : t[r] ? (t[r][s] = void 0, this.newest = t[r]) : this.oldest = this.newest = void 0, this.size--, t.value;
  }
  clear() {
    this.oldest = this.newest = void 0, this.size = 0, this._keymap.clear();
  }
  keys() {
    return new f(this.oldest);
  }
  values() {
    return new w(this.oldest);
  }
  entries() {
    return this;
  }
  [Symbol.iterator]() {
    return new v(this.oldest);
  }
  forEach(e, t) {
    typeof t != "object" && (t = this);
    let i = this.oldest;
    for (; i; )
      e.call(t, i.value, i.key, this), i = i[s];
  }
  /** Returns a JSON (array) representation */
  toJSON() {
    for (var e = new Array(this.size), t = 0, i = this.oldest; i; )
      e[t++] = { key: i.key, value: i.value }, i = i[s];
    return e;
  }
  /** Returns a String representation */
  toString() {
    for (var e = "", t = this.oldest; t; )
      e += String(t.key) + ":" + t.value, t = t[s], t && (e += " < ");
    return e;
  }
}
class v {
  constructor(e) {
    h(this, "entry");
    this.entry = e;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    let e = this.entry;
    return e ? (this.entry = e[s], { done: !1, value: [e.key, e.value] }) : { done: !0, value: void 0 };
  }
}
class f {
  constructor(e) {
    h(this, "entry");
    this.entry = e;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    let e = this.entry;
    return e ? (this.entry = e[s], { done: !1, value: e.key }) : { done: !0, value: void 0 };
  }
}
class w {
  constructor(e) {
    h(this, "entry");
    this.entry = e;
  }
  [Symbol.iterator]() {
    return this;
  }
  next() {
    let e = this.entry;
    return e ? (this.entry = e[s], { done: !1, value: e.value }) : { done: !0, value: void 0 };
  }
}
export {
  p as LRUMap
};
