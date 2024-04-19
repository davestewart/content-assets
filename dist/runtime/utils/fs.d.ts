export declare function readFile(path: string, asJson?: boolean): any;
export declare function writeFile(path: string, data: null | string | number | boolean | object): void;
export declare function writeBlob(path: string, data: object): Promise<void>;
export declare function copyFile(src: string, trg: string): void;
export declare function removeFile(src: string): void;
export declare function createFolder(path: string): void;
export declare function removeFolder(path: string): void;
export declare function removeEntry(path: string): void;
export declare function isFile(path: string): any;
