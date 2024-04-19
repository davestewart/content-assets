/**
 * Parses the query string from a path
 */
export declare function parseQuery(path: string): string;
/**
 * Removes the query string from a path
 */
export declare function removeQuery(path: string): string;
/**
 * Test path to be relative
 */
export declare function isRelative(path: string): boolean;
/**
 * Test if path is excluded (_partial or .ignored)
 * @param path
 */
export declare function isExcluded(path: string): boolean;
/**
 * Test path for image extension
 */
export declare function isImage(path: string): boolean;
/**
 * Test path is markdown
 */
export declare function isArticle(path: string): boolean;
/**
 * Test path is asset
 */
export declare function isAsset(path: string): boolean;
/**
 * Test if value is a relative asset
 */
export declare function isValidAsset(value?: string): boolean;
