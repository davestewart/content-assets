import { type MountOptions } from '@nuxt/content';
import { type WatchEvent, type Storage } from 'unstorage';
/**
 * Make a Storage instance that monitors assets from a single source
 */
export declare function makeSourceStorage(source: MountOptions | string, key?: string): Storage;
export interface SourceManager {
    storage: Storage;
    init: () => Promise<string[]>;
    keys: () => Promise<string[]>;
    dispose: () => Promise<void>;
}
/**
 * Make a SourceManager instance
 *
 * Each Source Manager is responsible for watching and mirroring source assets to the public assets folder
 *
 * @param key
 * @param source
 * @param publicPath
 * @param callback
 */
export declare function makeSourceManager(key: string, source: MountOptions, publicPath: string, callback?: (event: WatchEvent, path: string) => void): SourceManager;
