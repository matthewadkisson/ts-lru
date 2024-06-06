export declare class LRUMap<K, V> {
    private size;
    private limit;
    private oldest;
    private newest;
    private _keymap;
    constructor(limit: number, entries?: Iterable<[K, V]>);
    private _markEntryAsUsed;
    assign(entries: Iterable<[K, V]>): void;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    shift(): [K, V] | undefined;
    find(key: K): V | undefined;
    has(key: K): boolean;
    delete(key: K): V | undefined;
    clear(): void;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): Iterable<[K, V]>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    forEach(callback: (value: V, key: K, map: LRUMap<K, V>) => void, thisArg?: any): void;
    /** Returns a JSON (array) representation */
    toJSON(): {
        key: K;
        value: V;
    }[];
    /** Returns a String representation */
    toString(): string;
}

export { }
