/**
 * Common extensions
 */
export declare const extensions: {
    image: string[];
    media: string[];
};
/**
 * Create a Nuxt Content ignore string
 *
 * @see https://stackoverflow.com/questions/10052032/regex-pattern-that-does-not-match-certain-extensions
 * @see https://regex101.com/r/gC3HXz/1
 */
export declare function makeIgnores(extensions: string | string[]): string;
