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
})(Method || (Method = {}));
/** 是否必需 */
var Required;
(function (Required) {
  /** 不必需 */
  Required["false"] = "0";
  /** 必需 */
  Required["true"] = "1";
})(Required || (Required = {}));
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
})(RequestBodyType || (RequestBodyType = {}));
/** 请求表单条目类型 */
var RequestFormItemType;
(function (RequestFormItemType) {
  /** 纯文本 */
  RequestFormItemType["text"] = "text";
  /** 文件 */
  RequestFormItemType["file"] = "file";
})(RequestFormItemType || (RequestFormItemType = {}));
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
})(ResponseBodyType || (ResponseBodyType = {}));

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

var FileData = /*#__PURE__*/function () {
  /**
   * 文件数据辅助类，统一网页、小程序等平台的文件上传。
   *
   * @param originalFileData 原始文件数据
   */
  function FileData(originalFileData) {
    _classCallCheck(this, FileData);
    this.originalFileData = originalFileData;
  }
  /**
   * 获取原始文件数据。
   *
   * @returns 原始文件数据
   */
  _createClass(FileData, [{
    key: "getOriginalFileData",
    value: function getOriginalFileData() {
      return this.originalFileData;
    }
  }]);
  return FileData;
}();
/**
 * 解析请求数据，从请求数据中分离出普通数据和文件数据。
 *
 * @param requestData 要解析的请求数据
 * @returns 包含普通数据(data)和文件数据(fileData)的对象，data、fileData 为空对象时，表示没有此类数据
 */
function parseRequestData(requestData) {
  var result = {
    data: {},
    fileData: {}
  };
  if (requestData != null && _typeof(requestData) === 'object') {
    Object.keys(requestData).forEach(function (key) {
      if (requestData[key] && requestData[key] instanceof FileData) {
        result.fileData[key] = requestData[key].getOriginalFileData();
      } else {
        result.data[key] = requestData[key];
      }
    });
  }
  return result;
}

export { FileData, Method, RequestBodyType, RequestFormItemType, Required, ResponseBodyType, parseRequestData };
