export type Walkable = {
    [key: string | number]: any;
};
export type WalkFilter = (value: any, key?: string | number) => boolean | void;
export type WalkCallback = (value: any, parent: Walkable, key: string | number) => void;
/**
 * Walk an object structure
 *
 * @param node
 * @param callback
 * @param filter
 */
export declare function walk(node: any, callback: WalkCallback, filter?: WalkFilter): void;
export declare function isObject(data: any): any;
