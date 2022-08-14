"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBodyType = exports.RequestFormItemType = exports.RequestBodyType = exports.Required = exports.Method = void 0;
/** 请求方式 */
var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PUT"] = "PUT";
    Method["DELETE"] = "DELETE";
    Method["HEAD"] = "HEAD";
    Method["OPTIONS"] = "OPTIONS";
    Method["PATCH"] = "PATCH";
})(Method = exports.Method || (exports.Method = {}));
/** 是否必需 */
var Required;
(function (Required) {
    /** 不必需 */
    Required["false"] = "0";
    /** 必需 */
    Required["true"] = "1";
})(Required = exports.Required || (exports.Required = {}));
/** 请求数据类型 */
var RequestBodyType;
(function (RequestBodyType) {
    /** 查询字符串 */
    RequestBodyType["query"] = "query";
    /** 表单 */
    RequestBodyType["form"] = "form";
    /** JSON */
    RequestBodyType["json"] = "json";
    /** 纯文本 */
    RequestBodyType["text"] = "text";
    /** 文件 */
    RequestBodyType["file"] = "file";
    /** 原始数据 */
    RequestBodyType["raw"] = "raw";
    /** 无请求数据 */
    RequestBodyType["none"] = "none";
})(RequestBodyType = exports.RequestBodyType || (exports.RequestBodyType = {}));
/** 请求表单条目类型 */
var RequestFormItemType;
(function (RequestFormItemType) {
    /** 纯文本 */
    RequestFormItemType["text"] = "text";
    /** 文件 */
    RequestFormItemType["file"] = "file";
})(RequestFormItemType = exports.RequestFormItemType || (exports.RequestFormItemType = {}));
/** 返回数据类型 */
var ResponseBodyType;
(function (ResponseBodyType) {
    /** JSON */
    ResponseBodyType["json"] = "json";
    /** 纯文本 */
    ResponseBodyType["text"] = "text";
    /** XML */
    ResponseBodyType["xml"] = "xml";
    /** 原始数据 */
    ResponseBodyType["raw"] = "raw";
    // yapi 实际上返回的是 json，有另外的字段指示其是否是 json schema
    /** JSON Schema */
    // jsonSchema = 'json-schema',
})(ResponseBodyType = exports.ResponseBodyType || (exports.ResponseBodyType = {}));
