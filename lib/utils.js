"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileSync = exports.writeFile = exports.mkdirs = exports.resolveApp = exports.jsonSchemaToType = exports.propDefinitionsToJsonSchema = exports.mockjsTemplateToJsonSchema = exports.jsonToJsonSchema = exports.jsonSchemaStringToJsonSchema = exports.processJsonSchema = exports.getNormalizedRelativePath = exports.toUnixPath = exports.throwError = void 0;
const tslib_1 = require("tslib");
const consola_1 = tslib_1.__importDefault(require("consola"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const json_schema_generator_1 = tslib_1.__importDefault(require("json-schema-generator"));
const mockjs_1 = tslib_1.__importDefault(require("mockjs"));
const path_1 = tslib_1.__importDefault(require("path"));
const vtils_1 = require("vtils");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const helpers_1 = require("./helpers");
/**
 * 抛出错误。
 *
 * @param msg 错误信息
 */
function throwError(...msg) {
    throw new Error(msg.join(''));
}
exports.throwError = throwError;
/**
 * 将路径统一为 unix 风格的路径。
 *
 * @param path 路径
 * @returns unix 风格的路径
 */
function toUnixPath(path) {
    return path.replace(/[/\\]+/g, '/');
}
exports.toUnixPath = toUnixPath;
/**
 * 获得规范化的相对路径。
 *
 * @param from 来源路径
 * @param to 去向路径
 * @returns 相对路径
 */
function getNormalizedRelativePath(from, to) {
    return toUnixPath(path_1.default.relative(from, to))
        .replace(/^(?=[^.])/, './');
}
exports.getNormalizedRelativePath = getNormalizedRelativePath;
/**
 * 原地处理 JSONSchema。
 *
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 处理后的 JSONSchema
 */
function processJsonSchema(jsonSchema) {
    if (!(0, vtils_1.isObject)(jsonSchema))
        return jsonSchema;
    // 去除 title 和 id，防止 json-schema-to-typescript 提取它们作为接口名
    delete jsonSchema.title;
    delete jsonSchema.id;
    // 将 additionalProperties 设为 false
    jsonSchema.additionalProperties = false;
    // Mock.toJSONSchema 产生的 properties 为数组，然而 JSONSchema4 的 properties 为对象
    if ((0, vtils_1.isArray)(jsonSchema.properties)) {
        jsonSchema.properties = jsonSchema.properties
            .reduce((props, js) => {
            props[js.name] = js;
            return props;
        }, {});
    }
    // 继续处理对象的子元素
    if (jsonSchema.properties) {
        (0, vtils_1.forOwn)(jsonSchema.properties, processJsonSchema);
    }
    // 继续处理数组的子元素
    if (jsonSchema.items) {
        (0, vtils_1.castArray)(jsonSchema.items).forEach(processJsonSchema);
    }
    return jsonSchema;
}
exports.processJsonSchema = processJsonSchema;
/**
 * 将 JSONSchema 字符串转为 JSONSchema 对象。
 *
 * @param str 要转换的 JSONSchema 字符串
 * @returns 转换后的 JSONSchema 对象
 */
function jsonSchemaStringToJsonSchema(str) {
    return processJsonSchema(JSON.parse(str));
}
exports.jsonSchemaStringToJsonSchema = jsonSchemaStringToJsonSchema;
/**
 * 获得 JSON 数据的 JSONSchema 对象。
 *
 * @param json JSON 数据
 * @returns JSONSchema 对象
 */
function jsonToJsonSchema(json) {
    return processJsonSchema((0, json_schema_generator_1.default)(json));
}
exports.jsonToJsonSchema = jsonToJsonSchema;
/**
 * 获得 mockjs 模板的 JSONSchema 对象。
 *
 * @param template mockjs 模板
 * @returns JSONSchema 对象
 */
function mockjsTemplateToJsonSchema(template) {
    return processJsonSchema(mockjs_1.default.toJSONSchema(template));
}
exports.mockjsTemplateToJsonSchema = mockjsTemplateToJsonSchema;
/**
 * 获得属性定义列表的 JSONSchema 对象。
 *
 * @param propDefinitions 属性定义列表
 * @returns JSONSchema 对象
 */
function propDefinitionsToJsonSchema(propDefinitions) {
    return processJsonSchema({
        type: 'object',
        required: propDefinitions.reduce((res, prop) => {
            if (prop.required) {
                res.push(prop.name);
            }
            return res;
        }, []),
        properties: propDefinitions.reduce((res, prop) => {
            res[prop.name] = Object.assign({ type: prop.type, description: prop.comment }, (prop.type === 'file' ? { tsType: helpers_1.FileData.name } : {}));
            return res;
        }, {}),
    });
}
exports.propDefinitionsToJsonSchema = propDefinitionsToJsonSchema;
const JSTTOptions = {
    bannerComment: '',
    style: {
        bracketSpacing: false,
        printWidth: 120,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'none',
        useTabs: false,
    },
};
/**
 * 根据 JSONSchema 对象生产 TypeScript 类型定义。
 *
 * @param jsonSchema JSONSchema 对象
 * @param typeName 类型名称
 * @returns TypeScript 类型定义
 */
async function jsonSchemaToType(jsonSchema, typeName) {
    if ((0, vtils_1.isEmpty)(jsonSchema)) {
        return `export interface ${typeName} {}`;
    }
    const code = await (0, json_schema_to_typescript_1.compile)(jsonSchema, typeName, JSTTOptions);
    return code.trim();
}
exports.jsonSchemaToType = jsonSchemaToType;
const appDirectory = fs_1.default.realpathSync(process.cwd());
const resolveApp = (relativePath) => path_1.default.resolve(appDirectory, relativePath);
exports.resolveApp = resolveApp;
const mkdirs = (dirpath, callback) => {
    const exists = fs_1.default.existsSync(dirpath);
    if (exists) {
        callback();
    }
    else {
        //尝试创建父目录，然后再创建当前目录
        (0, exports.mkdirs)(path_1.default.dirname(dirpath), () => {
            fs_1.default.mkdirSync(dirpath);
            callback();
        });
    }
};
exports.mkdirs = mkdirs;
const writeFile = (dirpath, data) => {
    return new Promise((resolve, reject) => {
        fs_1.default.writeFile(dirpath, data, function (err) {
            if (err) {
                consola_1.default.error(`文件写入失败: ${dirpath}`);
                return reject(dirpath);
            }
            // consola.success(`文件写入成功: ${dirpath}`)
            return resolve(dirpath);
        });
    });
};
exports.writeFile = writeFile;
const writeFileSync = (dirpath, data) => {
    fs_1.default.writeFileSync(dirpath, data, { encoding: 'utf8', flag: 'w' });
    // consola.success(`文件写入成功: ${dirpath}`)
};
exports.writeFileSync = writeFileSync;
