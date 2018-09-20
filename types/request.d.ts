/// <reference types="node" />
export declare class RequestHeader {
    type: string;
    url: string;
    version: string;
    [i: string]: any;
    host: string;
    protocol?: 'http' | 'https';
    constructor(type: string, url: string, version: string);
    put(key: string, value: string): void;
    /**
     * 转换成字符串
     */
    toString(): string;
}
/**
 * 转换请求头
 */
export declare function parseRequest(): {
    on: {
        (type: "header", cb: (header: RequestHeader) => void): void;
        (type: "error", cb: (error: Error) => void): void;
        (type: "end", cb: () => void): void;
        (type: "line", cb: (buffer: Buffer) => void): void;
    };
    write: (data: Buffer) => number;
};
