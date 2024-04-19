import type { ParsedContent, AssetConfig } from '../../types';
/**
 * Manages the public assets
 */
export declare function makeAssetsManager(publicPath: string, shouldWatch?: boolean): {
    init: () => void;
    setAsset: (path: string) => AssetConfig;
    getAsset: (path: string) => AssetConfig | undefined;
    removeAsset: (path: string) => AssetConfig | undefined;
    resolveAsset: (content: ParsedContent, relAsset: string, registerContent?: boolean) => Partial<AssetConfig>;
    dispose: () => Promise<void>;
};
/**
 * Hash of replacer functions
 */
export declare const replacers: Record<string, (src: string) => string>;
/**
 * Interpolate assets path pattern
 *
 * @param pattern   A path pattern with tokens
 * @param src       The relative path to a src asset
 * @param warn      An optional flag to warn for unknown tokens
 */
export declare function interpolatePattern(pattern: string, src: string, warn?: boolean): string;
/**
 * Parse asset paths from absolute path
 *
 * @param srcDir    The absolute path to the asset's source folder
 * @param srcAbs    The absolute path to the asset itself
 */
export declare function getAssetPaths(srcDir: string, srcAbs: string): {
    srcRel: string;
    srcAttr: string;
};
/**
 * Get asset image sizes
 *
 * @param srcAbs    The absolute path to the asset itself
 */
export declare function getAssetSize(srcAbs: string): {
    width?: number;
    height?: number;
};
