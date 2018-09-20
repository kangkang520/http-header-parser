/// <reference types="node" />
export declare function createReader(): {
    on: (type: string, cb: (...args: any[]) => any) => void;
    write: (data: Buffer) => number;
    end: () => void;
};
