/// <reference types="node" />
declare class ResponseHeader {
    version: string;
    statusCode: number;
    status: string;
    [i: string]: any;
    /**
     * http响应头
     * @param version http版本号
     * @param statusCode 状态码
     * @param status 状态说明
     */
    constructor(version: string, statusCode: number, status?: string);
    /**
     * 放入一个键
     * @param key 键名称
     * @param value 值
     */
    put(key: string, value: string): void;
    /**
     * 转换成字符串
     */
    toString(): string;
}
/**
 * 转换响应头
 */
export declare function parseResponse(): {
    on: {
        (type: "header", cb: (header: ResponseHeader) => void): void;
        (type: "error", cb: (error: Error) => void): void;
        (type: "end", cb: () => void): void;
        (type: "line", cb: (buffer: Buffer) => void): void;
    };
    write: (data: Buffer) => number;
};
export {};
