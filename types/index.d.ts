/// <reference types="node" />
interface IRequestHeader {
    type: string;
    host: string;
    version: string;
    [i: string]: string;
}
/**
 * 创建一个请求头转换器
 */
export declare function headerParser(): {
    /**
     * 监听事件
     * @param type 事件类型
     * @param cb 回调函数
     */
    once<K extends "error" | "end" | "header" | "line">(type: K, cb: {
        header: (req: IRequestHeader) => void;
        error: (err: Error) => void;
        line: (line: string) => void;
        end: () => void;
    }[K]): void;
    /**
     * 写入数据
     * @param data 要写入的数据
     */
    write(data: Buffer): void;
};
export {};
