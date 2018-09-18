/// <reference types="node" />
export declare class RequestHeader {
    type: string;
    host: string;
    version: string;
    [i: string]: any;
    constructor(type: string, host: string, version: string);
    put(key: string, value: string): void;
    /**
     * 转换成字符串
     */
    toString(): string;
}
/**
 * 创建一个请求头转换器
 */
export declare function headerParser(): {
    on: {
        (type: "header", cb: (header: RequestHeader) => void): void;
        (type: "error", cb: (error: Error) => void): void;
        (type: "end", cb: () => void): void;
        (type: "line", cb: (line: string) => void): void;
    };
    write: (data: Buffer) => void;
};
