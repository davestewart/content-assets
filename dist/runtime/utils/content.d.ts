import type { ParsedContent } from '../../types';
import { type WalkCallback } from './object';
/**
 * Walk parsed content meta, only processing relevant properties
 *
 * @param content
 * @param callback
 */
export declare function walkMeta(content: ParsedContent, callback: WalkCallback): void;
/**
 * Walk parsed content body, only visiting relevant tags
 *
 * @param content
 * @param callback
 */
export declare function walkBody(content: ParsedContent, callback: (node: any) => void): void;
