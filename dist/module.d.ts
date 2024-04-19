import * as _nuxt_schema from '@nuxt/schema';

interface ModuleOptions {
    /**
     * Image size hints
     *
     * @example 'attrs style url'
     * @default 'style'
     */
    imageSize?: string | string[] | false;
    /**
     * List of content extensions; anything else as an asset
     *
     * @example 'md'
     * @default 'md csv ya?ml json'
     */
    contentExtensions?: string | string[];
    /**
     * Display debug messages
     *
     * @example true
     * @default false
     */
    debug?: boolean;
}

declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

export { _default as default };
