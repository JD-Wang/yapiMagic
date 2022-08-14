import { JSONSchema4 } from 'json-schema';
import { PropDefinitions } from './types';
/**
 * 抛出错误。
 *
 * @param msg 错误信息
 */
export declare function throwError(...msg: string[]): never;
/**
 * 将路径统一为 unix 风格的路径。
 *
 * @param path 路径
 * @returns unix 风格的路径
 */
export declare function toUnixPath(path: string): string;
/**
 * 获得规范化的相对路径。
 *
 * @param from 来源路径
 * @param to 去向路径
 * @returns 相对路径
 */
export declare function getNormalizedRelativePath(from: string, to: string): string;
/**
 * 原地处理 JSONSchema。
 *
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 处理后的 JSONSchema
 */
export declare function processJsonSchema<T extends JSONSchema4>(jsonSchema: T): T;
/**
 * 将 JSONSchema 字符串转为 JSONSchema 对象。
 *
 * @param str 要转换的 JSONSchema 字符串
 * @returns 转换后的 JSONSchema 对象
 */
export declare function jsonSchemaStringToJsonSchema(str: string): JSONSchema4;
/**
 * 获得 JSON 数据的 JSONSchema 对象。
 *
 * @param json JSON 数据
 * @returns JSONSchema 对象
 */
export declare function jsonToJsonSchema(json: object): JSONSchema4;
/**
 * 获得 mockjs 模板的 JSONSchema 对象。
 *
 * @param template mockjs 模板
 * @returns JSONSchema 对象
 */
export declare function mockjsTemplateToJsonSchema(template: object): JSONSchema4;
/**
 * 获得属性定义列表的 JSONSchema 对象。
 *
 * @param propDefinitions 属性定义列表
 * @returns JSONSchema 对象
 */
export declare function propDefinitionsToJsonSchema(propDefinitions: PropDefinitions): JSONSchema4;
/**
 * 根据 JSONSchema 对象生产 TypeScript 类型定义。
 *
 * @param jsonSchema JSONSchema 对象
 * @param typeName 类型名称
 * @returns TypeScript 类型定义
 */
export declare function jsonSchemaToType(jsonSchema: JSONSchema4, typeName: string): Promise<string>;
export declare const resolveApp: (relativePath: string) => string;
export declare const mkdirs: (dirpath: string, callback: () => any) => void;
export declare const writeFile: (dirpath: string, data: string) => Promise<any>;
export declare const writeFileSync: (dirpath: string, data: string) => void;
