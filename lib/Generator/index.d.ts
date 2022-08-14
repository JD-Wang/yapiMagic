import * as Types from './../types';
export declare class Generator {
    config: Types.ServerConfig;
    deletedFiles: Types.IFiles;
    modifiedFiles: Types.IFiles;
    addedFiles: Types.IFiles;
    unModifiedFiles: string[];
    serverUrl: string;
    readonly ignoreFiles: string[];
    constructor(config: Types.ServerConfig);
    fetchApi(projectConfig?: Types.ServerConfig): Promise<Types.ApiJson>;
    /** 生成请求数据类型 */
    generateRequestDataType(interfaceInfo: Types.Interface, typeName: string): Promise<string>;
    /** 生成响应数据类型 */
    generateResponseDataType({ interfaceInfo, typeName, dataKey }: {
        interfaceInfo: Types.Interface;
        typeName: string;
        dataKey?: string;
    }): Promise<string>;
    generate(): Promise<Types.IOutPut[]>;
    /**
     * 比对文件 确定文件状态
     */
    compareApiFile(files: string[], name: string, data: string): void;
    getfileDiff(oldStr: string, str: string): string;
    getDeletedFiles(files: string[], outputs: string[]): void;
    deepCompareWithoutTime(data: object, nextData: object): any;
    writeLog(): void;
    write(outputsBase: Types.IOutPut[], callback?: (isNew: boolean) => void): void;
    generateApiFileCode(api: Types.IOutPut): string;
    generateIndexCode(apis: string[]): string;
    /** 生成api name规则 */
    generateApiName({ path, _id, }: {
        path: string;
        _id: string | number;
    }): string;
}
