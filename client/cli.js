#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var TSNode = require('ts-node');
var cli = _interopDefault(require('commander'));
var consola = _interopDefault(require('consola'));
var express = _interopDefault(require('express'));
var fs = _interopDefault(require('fs-extra'));
var open = _interopDefault(require('open'));
var ora = _interopDefault(require('ora'));
var path = _interopDefault(require('path'));
var prompt = _interopDefault(require('prompts'));
var tslib = require('tslib');
var changeCase = require('change-case');
var _ = _interopDefault(require('lodash'));
var gitDiff = _interopDefault(require('git-diff'));
var JSON5 = _interopDefault(require('json5'));
var prettier = _interopDefault(require('prettier'));
var request = _interopDefault(require('request-promise-native'));
var child_process = require('child_process');
var inquirer = _interopDefault(require('inquirer'));
var fs$1 = _interopDefault(require('fs'));
var jsonSchemaGenerator = _interopDefault(require('json-schema-generator'));
var Mock = _interopDefault(require('mockjs'));
var vtils = require('vtils');
var jsonSchemaToTypescript = require('json-schema-to-typescript');

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

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _await(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var fileDir = path.join(__dirname, '.yapiUser');

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var userLogin = _async(function (email, password, serverUrl) {
  var req = {
    email: email,
    password: password
  };
  return _catch(function () {
    return _await(request({
      method: 'POST',
      uri: "".concat(serverUrl, "/api/user/login"),
      body: req,
      json: true,
      resolveWithFullResponse: true
    }), function (res) {
      var _res$headers$setCook = _slicedToArray(res.headers['set-cookie'], 2),
          cookie0 = _res$headers$setCook[0],
          cookie1 = _res$headers$setCook[1];

      var _yapi_token = cookie0.split(';')[0].split('=')[1];
      var _yapi_uid = cookie1.split(';')[0].split('=')[1];
      consola.success('账户登录成功'); // 写入文件

      writeUserInfo(req);
      return {
        _yapi_token: _yapi_token,
        _yapi_uid: _yapi_uid
      };
    });
  }, function (e) {
    consola.error('登录失败');
    return Promise.reject(e);
  });
});

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

function _invoke(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

function writeUserInfo(data) {
  try {
    fs.writeFile(fileDir, JSON.stringify(data), function (err) {
      if (err) {
        consola.error("\u6587\u4EF6\u5199\u5165\u5931\u8D25");
      }
    });
  } catch (error) {
    consola.error("\u6587\u4EF6\u5199\u5165\u5931\u8D25");
  }
}

var requestToken = _async(function (serverUrl) {
  // 获取配置中的账号密码
  var email = '';
  var password = '';

  if (fs.existsSync(fileDir)) {
    try {
      var conf = JSON.parse(fs.readFileSync(fileDir, 'utf-8'));
      email = conf.email;
      password = conf.password;
    } catch (error) {}
  }

  return _invoke(function () {
    if (!email || !password) {
      consola.warn("\u672A\u767B\u9646, \u8BF7\u6267\u884C yapiMagic login \u8FDB\u884C\u767B\u9646");
      return _await(inquirer.prompt([{
        type: 'input',
        name: 'email',
        message: '请输入账号:'
      }, {
        type: 'input',
        name: 'password',
        message: '请输入密码:'
      }]), function (conf) {
        email = conf.email;
        password = conf.password;
      });
    }
  }, function () {
    // 自动登录
    return userLogin(email, password, serverUrl);
  });
});

var Login = /*#__PURE__*/function () {
  function Login() {
    _classCallCheck(this, Login);

    this._yapi_token = '';
    this._yapi_uid = '';
  }

  _createClass(Login, [{
    key: "run",
    value: function run(serverUrl) {
      var _this = this;

      return _await(requestToken(serverUrl), function (_ref) {
        var _yapi_token = _ref._yapi_token,
            _yapi_uid = _ref._yapi_uid;
        _this._yapi_token = _yapi_token;
        _this._yapi_uid = _yapi_uid;
      });
    }
  }, {
    key: "isLogin",
    value: function isLogin() {
      return !!this._yapi_token;
    }
  }, {
    key: "getToken",
    value: function getToken() {
      if (!this._yapi_token || !this._yapi_uid) {
        consola.warn('没有登陆，请重新执行');
        process.exit(0);
      }

      return {
        _yapi_token: this._yapi_token,
        _yapi_uid: this._yapi_uid
      };
    }
  }]);

  return Login;
}();

var login = new Login();

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

  ResponseBodyType["raw"] = "raw"; // yapi 实际上返回的是 json，有另外的字段指示其是否是 json schema

  /** JSON Schema */
  // jsonSchema = 'json-schema',
})(ResponseBodyType || (ResponseBodyType = {}));

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
 * 抛出错误。
 *
 * @param msg 错误信息
 */

/**
 * 根据 JSONSchema 对象生产 TypeScript 类型定义。
 *
 * @param jsonSchema JSONSchema 对象
 * @param typeName 类型名称
 * @returns TypeScript 类型定义
 */
function _await$1(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _async$1(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var jsonSchemaToType = _async$1(function (jsonSchema, typeName) {
  return vtils.isEmpty(jsonSchema) ? "export interface ".concat(typeName, " {}") : _await$1(jsonSchemaToTypescript.compile(jsonSchema, typeName, JSTTOptions), function (code) {
    return code.trim();
  });
});
/**
 * 原地处理 JSONSchema。
 *
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 处理后的 JSONSchema
 */

function processJsonSchema(jsonSchema) {
  if (!vtils.isObject(jsonSchema)) return jsonSchema; // 去除 title 和 id，防止 json-schema-to-typescript 提取它们作为接口名

  delete jsonSchema.title;
  delete jsonSchema.id; // 将 additionalProperties 设为 false

  jsonSchema.additionalProperties = false; // Mock.toJSONSchema 产生的 properties 为数组，然而 JSONSchema4 的 properties 为对象

  if (vtils.isArray(jsonSchema.properties)) {
    jsonSchema.properties = jsonSchema.properties.reduce(function (props, js) {
      props[js.name] = js;
      return props;
    }, {});
  } // 继续处理对象的子元素


  if (jsonSchema.properties) {
    vtils.forOwn(jsonSchema.properties, processJsonSchema);
  } // 继续处理数组的子元素


  if (jsonSchema.items) {
    vtils.castArray(jsonSchema.items).forEach(processJsonSchema);
  }

  return jsonSchema;
}
/**
 * 将 JSONSchema 字符串转为 JSONSchema 对象。
 *
 * @param str 要转换的 JSONSchema 字符串
 * @returns 转换后的 JSONSchema 对象
 */

function jsonSchemaStringToJsonSchema(str) {
  return processJsonSchema(JSON.parse(str));
}
/**
 * 获得 JSON 数据的 JSONSchema 对象。
 *
 * @param json JSON 数据
 * @returns JSONSchema 对象
 */

function jsonToJsonSchema(json) {
  return processJsonSchema(jsonSchemaGenerator(json));
}
/**
 * 获得 mockjs 模板的 JSONSchema 对象。
 *
 * @param template mockjs 模板
 * @returns JSONSchema 对象
 */

function mockjsTemplateToJsonSchema(template) {
  return processJsonSchema(Mock.toJSONSchema(template));
}
/**
 * 获得属性定义列表的 JSONSchema 对象。
 *
 * @param propDefinitions 属性定义列表
 * @returns JSONSchema 对象
 */

function propDefinitionsToJsonSchema(propDefinitions) {
  return processJsonSchema({
    type: 'object',
    required: propDefinitions.reduce(function (res, prop) {
      if (prop.required) {
        res.push(prop.name);
      }

      return res;
    }, []),
    properties: propDefinitions.reduce(function (res, prop) {
      res[prop.name] = Object.assign({
        type: prop.type,
        description: prop.comment
      }, prop.type === 'file' ? {
        tsType: FileData.name
      } : {});
      return res;
    }, {})
  });
}
var JSTTOptions = {
  bannerComment: '',
  style: {
    bracketSpacing: false,
    printWidth: 120,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'none',
    useTabs: false
  }
};
var appDirectory = fs$1.realpathSync(process.cwd());
var resolveApp = function resolveApp(relativePath) {
  return path.resolve(appDirectory, relativePath);
};
var mkdirs = function mkdirs(dirpath, callback) {
  var exists = fs$1.existsSync(dirpath);

  if (exists) {
    callback();
  } else {
    //尝试创建父目录，然后再创建当前目录
    mkdirs(path.dirname(dirpath), function () {
      fs$1.mkdirSync(dirpath);
      callback();
    });
  }
};
var writeFileSync = function writeFileSync(dirpath, data) {
  fs$1.writeFileSync(dirpath, data, {
    encoding: 'utf8',
    flag: 'w'
  }); // consola.success(`文件写入成功: ${dirpath}`)
};

function _await$2(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

var readGitStatus = function readGitStatus() {
  // const root = path.resolve(__dirname, '../../')
  // 获取git 工作区状态
  var stdout = child_process.execSync('git status --porcelain', {
    stdio: ['pipe', 'pipe', 'ignore']
  }).toString().trim();
  var isGitWorkspaceEmpty = stdout === ''; // 获取当前分支名称

  var branchName = child_process.execSync('git symbolic-ref --short -q HEAD').toString().trim(); // console.log(`分支: ${branchName} git 工作区 ${isGitWorkspaceEmpty}`)

  return {
    isGitWorkspaceEmpty: isGitWorkspaceEmpty,
    branchName: branchName
  };
};

function _catch$1(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var _readGitStatus = readGitStatus(),
    branchName = _readGitStatus.branchName;

function _async$2(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var Generator = /*#__PURE__*/function () {
  function Generator(config) {
    _classCallCheck(this, Generator);

    this.deletedFiles = {};
    this.modifiedFiles = {};
    this.addedFiles = {};
    this.unModifiedFiles = [];
    this.ignoreFiles = ['update.log', 'update.json', 'index.ts', 'index.js'];
    this.config = config;
    this.serverUrl = '';
  }

  _createClass(Generator, [{
    key: "fetchApi",
    value: function fetchApi(projectConfig) {
      try {
        var _this2 = this;

        if (projectConfig === undefined) projectConfig = _this2.config;
        // if (!isGitWorkspaceEmpty && !this.config.notCheckGit) {
        //   consola.error(`请先处理git工作区未提交文件，再运行 yapiMagic`)
        //   process.exit(0)
        // }
        // 登录 获取用户信息
        var _projectConfig = projectConfig,
            projectId = _projectConfig.projectId,
            serverUrl = _projectConfig.serverUrl;
        _this2.serverUrl = serverUrl; // 获取api

        var url = "".concat(serverUrl, "/api/plugin/export?type=json&pid=").concat(projectId, "&status=all&isWiki=false");

        var _login$getToken = login.getToken(),
            _yapi_token = _login$getToken._yapi_token,
            _yapi_uid = _login$getToken._yapi_uid;

        var headers = {
          Cookie: "_yapi_token=".concat(_yapi_token, ";_yapi_uid=").concat(_yapi_uid)
        };
        return _await$2(request.get(url, {
          json: true,
          headers: headers
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    /** 生成请求数据类型 */

  }, {
    key: "generateRequestDataType",
    value: function generateRequestDataType(interfaceInfo, typeName) {
      try {
        var jsonSchema = {};

        switch (interfaceInfo.method) {
          case Method.GET:
          case Method.HEAD:
          case Method.OPTIONS:
            jsonSchema = propDefinitionsToJsonSchema(interfaceInfo.req_query.map(function (item) {
              return {
                name: item.name,
                required: item.required === Required["true"],
                type: 'string',
                comment: item.desc
              };
            }));
            break;

          default:
            switch (interfaceInfo.req_body_type) {
              case RequestBodyType.form:
                jsonSchema = propDefinitionsToJsonSchema(interfaceInfo.req_body_form.map(function (item) {
                  return {
                    name: item.name,
                    required: item.required === Required["true"],
                    type: item.type === RequestFormItemType.file ? 'file' : 'string',
                    comment: item.desc
                  };
                }));
                break;

              case RequestBodyType.json:
                if (interfaceInfo.req_body_other) {
                  jsonSchema = interfaceInfo.req_body_is_json_schema ? jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other) : jsonToJsonSchema(JSON5.parse(interfaceInfo.req_body_other));
                }

                break;

              default:
                break;
            }

            break;
        }

        return _await$2(jsonSchemaToType(jsonSchema, typeName));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    /** 生成响应数据类型 */

  }, {
    key: "generateResponseDataType",
    value: function generateResponseDataType(_ref) {
      var interfaceInfo = _ref.interfaceInfo,
          typeName = _ref.typeName,
          dataKey = _ref.dataKey;

      try {
        var jsonSchema = {};

        switch (interfaceInfo.res_body_type) {
          case ResponseBodyType.json:
            if (interfaceInfo.res_body) {
              jsonSchema = interfaceInfo.res_body_is_json_schema ? jsonSchemaStringToJsonSchema(interfaceInfo.res_body) : mockjsTemplateToJsonSchema(JSON5.parse(interfaceInfo.res_body));
            }

            break;

          default:
            return _await$2("export type ".concat(typeName, " = any"));
        }

        if (dataKey && jsonSchema && jsonSchema.properties && jsonSchema.properties[dataKey]) {
          jsonSchema = jsonSchema.properties[dataKey];
        }

        return _await$2(jsonSchemaToType(jsonSchema, typeName));
      } catch (e) {
        return Promise.reject(e);
      }
    }
  }, {
    key: "generate",
    value: function generate() {
      try {
        var _this4 = this;

        // if (!isGitWorkspaceEmpty) {
        //   consola.error('检测到您git工作区存在未提交文件，请先处理')
        //   return Promise.reject()
        // }
        return _await$2(_catch$1(function () {
          return _await$2(_this4.fetchApi(), function (res) {
            // const {
            //   include: includeCatIds,
            //   exclude: excludeCatIds,
            // }= this.config.catid || { include: null, exclude: null }
            // TODO: customizeFilter
            var customizeFilter = _this4.config.customizeFilter;
            return _await$2(Promise.all(res.map(_async$2(function (catItem) {
              var list = catItem.list,
                  rest = tslib.__rest(catItem // customizeFilter 过滤掉 不生成的接口
              , ["list"]); // customizeFilter 过滤掉 不生成的接口


              var listCustomizeFilter = list.filter(function (file) {
                var _id = file._id,
                    path = file.path;
                var newItem = Object.assign(Object.assign({}, file), {
                  id: file._id,
                  name: _this4.generateApiName({
                    path: path,
                    _id: _id
                  }),
                  yapiBaseInfo: Object.assign({}, file)
                });
                return customizeFilter ? customizeFilter(newItem, {
                  currentGitBranch: branchName
                }) : true;
              });
              return _await$2(Promise.all(listCustomizeFilter.map(_async$2(function (apiItem) {
                var name = _this4.generateApiName({
                  path: apiItem.path,
                  _id: apiItem._id
                });

                var reqInterfaceName = "IReq".concat(name);
                var resInterfaceName = "IRes".concat(name);
                return _await$2(_this4.generateRequestDataType(apiItem, reqInterfaceName), function (requestInterface) {
                  return _await$2(_this4.generateResponseDataType({
                    interfaceInfo: apiItem,
                    typeName: resInterfaceName,
                    dataKey: _this4.config.projectId
                  }), function (responseInterface) {
                    // 输出class 便于使用类型
                    // requestInterface = requestInterface.replace('export interface', 'export class')
                    if (apiItem.method.toLocaleUpperCase() === 'GET') {
                      // get 类型 无法区分参数是number string
                      requestInterface = requestInterface.replace(/\sstring;/g, ' string | number;');
                    } // responseInterface = responseInterface.replace('export interface', 'export class')


                    return Object.assign({
                      reqInterfaceName: reqInterfaceName,
                      requestInterface: requestInterface,
                      resInterfaceName: resInterfaceName,
                      responseInterface: responseInterface
                    }, apiItem);
                  });
                });
              }))), function (newList) {
                return Object.assign(Object.assign({}, rest), {
                  list: newList
                });
              });
            }))), function (filesDesc) {
              var arr = [];
              filesDesc.forEach(function (files) {
                files.list.forEach(function (file) {
                  var path = file.path,
                      _id = file._id;

                  var name = _this4.generateApiName({
                    path: path,
                    _id: _id
                  }); // pascalCase


                  var item = {
                    id: file._id,
                    catid: file.catid,
                    path: file.path,
                    name: name,
                    method: file.method,
                    title: file.title,
                    markdown: file.markdown || '',
                    reqInterfaceName: file.reqInterfaceName,
                    resInterfaceName: file.resInterfaceName,
                    requestInterface: file.requestInterface,
                    responseInterface: file.responseInterface,
                    yapiBaseInfo: Object.assign({}, file)
                  };
                  arr.push(item);
                });
              });
              return arr;
            });
          });
        }, function () {
          consola.error("\u9047\u5230\u9519\u8BEF\uFF0C\u6D41\u7A0B\u5DF2\u4E2D\u65AD");
          process.exit(0);
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    /**
     * 比对文件 确定文件状态
     */

  }, {
    key: "compareApiFile",
    value: function compareApiFile(files, name, data) {
      var _this5 = this;

      // TODO: data 空格处理
      var matched = files.filter(function (file) {
        return file.replace(".".concat(_this5.config.target), '') === name;
      });

      if (matched.length > 0) {
        // 已存在该文件
        var realPath = "".concat(this.config.outputFilePath, "/").concat(name, ".").concat(this.config.target);
        var oldData = fs.readFileSync(realPath, 'utf-8').toString();
        var data1 = prettier.format(data, {
          parser: this.config.target === 'ts' ? 'typescript' : 'babel',
          singleQuote: true,
          semi: false,
          tabWidth: 4
        });

        if (oldData !== data1) {
          // 修改已存在文件
          var diffResult = this.getfileDiff(oldData, data1);

          if (diffResult) {
            this.modifiedFiles[name] = diffResult;
          } // this.modifiedFiles.push(`${name}.${this.config.target}`)


          writeFileSync(resolveApp("".concat(this.config.outputFilePath, "/").concat(name, ".").concat(this.config.target)), data1);
        }
      } else {
        // 不存在 新增
        var _diffResult = this.getfileDiff('', data);

        this.addedFiles[name] = _diffResult;
        writeFileSync(resolveApp("".concat(this.config.outputFilePath, "/").concat(name, ".").concat(this.config.target)), prettier.format(data, {
          parser: this.config.target === 'ts' ? 'typescript' : 'babel'
        })); // this.addedFiles.push(`${name}.${this.config.target}`)
      }
    } // 文件新旧内容 diff

  }, {
    key: "getfileDiff",
    value: function getfileDiff(oldStr, str) {
      return gitDiff(oldStr, str, {
        color: false,
        save: true,
        wordDiff: false,
        flags: '--ignore-all-space'
      });
    }
  }, {
    key: "getDeletedFiles",
    value: function getDeletedFiles(files, outputs) {
      var _this6 = this;

      // files里存在 outputs不存在 则为即将删除的文件
      files.forEach(function (file) {
        if (outputs.indexOf(file) === -1 && _this6.ignoreFiles.indexOf(file) === -1) {
          // this.deletedFiles.push(file)
          // const diffResult = this.getfileDiff('', data)
          // 删除的文件不需要文件内容的记录
          _this6.deletedFiles[file] = '';
          fs.unlinkSync(resolveApp("".concat(_this6.config.outputFilePath, "/").concat(file)));
        }
      });
    } // 深度比较 不包含 time字段

  }, {
    key: "deepCompareWithoutTime",
    value: function deepCompareWithoutTime(data, nextData) {
      function changes(data, nextData) {
        return _.transform(data, function (result, value, key) {
          if (!_.isEqual(value, nextData[key])) {
            result[key] = _.isObject(value) && _.isObject(nextData[key]) ? changes(value, nextData[key]) : value;
          }
        });
      }

      return changes(data, nextData);
    } // 生成日志文件

  }, {
    key: "writeLog",
    value: function writeLog() {
      var deletedFiles = this.deletedFiles,
          modifiedFiles = this.modifiedFiles,
          addedFiles = this.addedFiles;
      var fileName = resolveApp("".concat(this.config.outputFilePath, "/update.json"));
      var apiUpdateItemJson = {
        time: new Date(),
        modifiedFiles: modifiedFiles,
        addedFiles: addedFiles,
        deletedFiles: deletedFiles
      };
      var isExists = fs.existsSync(fileName);
      var data = [];

      if (isExists) {
        data = JSON.parse(fs.readFileSync(fileName).toString());
        data.push(apiUpdateItemJson); // 深度比较 去重

        for (var i = 0; i < data.length; i++) {
          // 与下一个比较
          if (i < data.length - 1) {
            var result = this.deepCompareWithoutTime(data[i], data[i + 1]); // diff 比对只有time字段出现差异 视为两个相同的更新
            // 删除本项

            if (Object.keys(result).length === 1 && result.time) {
              console.log(result);
              data.splice(i, 1);
              i--;
            }
          }
        }
      } else {
        // 第一次生成文件 写入数组格式
        data = [apiUpdateItemJson];
      }

      fs.writeFileSync(fileName, JSON.stringify(data));
    }
  }, {
    key: "write",
    value: function write(outputsBase, callback) {
      var _this7 = this;

      // 生成api文件夹
      // catid 过滤
      try {
        var outputs = outputsBase.filter(function (ele) {
          // if (this.config.customizeFilter) {
          //   return this.config.customizeFilter(ele, branchName)
          // }
          return true; // if (this.config.catid && this.config.catid.exclude) {
          //   // 不期望的 catid 分类
          //   return this.config.catid.exclude.indexOf(String(ele.catid)) === -1
          // } else if (this.config.catid && this.config.catid.include) {
          //   // 只生成 catid 分类
          //   return this.config.catid.include.indexOf(String(ele.catid)) > -1
          // } else {
          //   return true
          // }
        });
        mkdirs(this.config.outputFilePath, function () {
          var files = fs.readdirSync(resolveApp(_this7.config.outputFilePath)); // files里存在 outputs不存在 则为即将删除的文件
          // 1.1.0 采用不删除接口文件策略 由于删除是个低频且高风险操作
          // this.getDeletedFiles(files, outputs.map(output => `${output.name}.${this.config.target}`))

          if (outputs.length === 0) {
            consola.info("\uD83D\uDE04 project: ".concat(_this7.config.projectId, " \u8FD0\u884C\u7ED3\u675F\uFF0C\u6CA1\u6709\u5339\u914D\u63A5\u53E3"));
            return;
          }

          outputs.forEach(function (api, i) {
            var data = _this7.generateApiFileCode(api);

            _this7.compareApiFile(files, api.name, data);

            if (i === outputs.length - 1) {
              var deletedFiles = _this7.deletedFiles,
                  modifiedFiles = _this7.modifiedFiles,
                  addedFiles = _this7.addedFiles;
              var deleteds = Object.keys(deletedFiles);
              var modifieds = Object.keys(modifiedFiles);
              var addeds = Object.keys(addedFiles);

              if (modifieds.length === 0 && addeds.length === 0 && deleteds.length === 0) {
                consola.success('无接口文件更新');
                return callback && callback(false);
              }

              if (addeds.length > 0) {
                consola.log('---------------------------------------------------');
                consola.success("\uD83D\uDE0E \u65B0\u589E\u63A5\u53E3\uFF1A".concat(addeds.length, " \u4E2A, \u5982\u4E0B:"));
                addeds.forEach(function (added) {
                  consola.info(added);
                });
              }

              if (modifieds.length > 0) {
                consola.log('---------------------------------------------------');
                consola.warn("\u2757 \u66F4\u65B0\u63A5\u53E3\uFF1A".concat(modifieds.length, " \u4E2A, \u5982\u4E0B:"));
                modifieds.forEach(function (added) {
                  consola.info(added);
                });
              }

              if (deleteds.length > 0) {
                consola.log('---------------------------------------------------');
                consola.warn("\uD83D\uDEAB \u5220\u9664\u63A5\u53E3\uFF1A".concat(deleteds.length, " \u4E2A, \u5982\u4E0B:"));
                deleteds.forEach(function (added) {
                  consola.info(added);
                });
              }

              consola.warn("project: ".concat(_this7.config.projectId, ", \u5171\u8BA1\u66F4\u65B0\u4E86").concat(addeds.length + deleteds.length + modifieds.length, "\u4E2A\u63A5\u53E3\u6587\u4EF6\uFF0C\u8BF7\u5230git\u5DE5\u4F5C\u533A\u6BD4\u5BF9\u6587\u4EF6\u66F4\u65B0"));
              consola.log('==================================================='); // generateIndexFile 控制 index 入口

              if (_this7.config.generateIndexFile) {
                var AllApi = outputs.map(function (output) {
                  return output.name;
                });

                var indexData = _this7.generateIndexCode(AllApi);

                mkdirs(_this7.config.outputFilePath, function () {
                  writeFileSync(resolveApp("".concat(_this7.config.outputFilePath, "/index.").concat(_this7.config.target)), indexData);
                });
              } // generateUpdateJson 控制 updateJson


              _this7.config.generateUpdateJson && _this7.writeLog();
              return callback && callback(true);
            }
          });
        });
      } catch (e) {
        console.log('write 方法执行 错误');
        console.error(e);
      }
    }
  }, {
    key: "generateApiFileCode",
    value: function generateApiFileCode(api) {
      if (this.config.generateApiFileCode) {
        return this.config.generateApiFileCode(api);
      }

      var data = ["\n/**\n* ".concat(api.title, "\n* ").concat(api.markdown || '', "\n**/\n      "), api.requestInterface, api.responseInterface, "\nexport default (data: IReq) => request({\nmethod: '".concat(api.method, "',\nurl: '").concat(api.path, "',\ndata: data\n})\n      ")];
      return data.join("\n    ");
    }
  }, {
    key: "generateIndexCode",
    value: function generateIndexCode(apis) {
      var arr = apis.map(function (api) {
        return "import ".concat(api, " from './").concat(api, "'");
      });
      var importStr = arr.join("\n    ");
      var exportStr = "\nexport default {\n  ".concat(apis.join(",\n  "), "\n}\n    ");
      return "\n".concat(importStr, "\n\n").concat(exportStr, "\n    ");
    }
    /** 生成api name规则 */

  }, {
    key: "generateApiName",
    value: function generateApiName(_ref2) {
      var path = _ref2.path,
          _id = _ref2._id;

      if (this.config.generateApiName) {
        return this.config.generateApiName(path, _id);
      }

      var reg = new RegExp('/', 'g');
      var name = path.replace(reg, ' ').trim();
      name = changeCase.pascalCase(name.trim());
      name += _id;
      return name;
    }
  }]);

  return Generator;
}();

var configTemplate = "\nimport { ServerConfig } from 'ywapi2ts'\n\nconst config: ServerConfig = {\n  target: 'ts',\n  serverUrl: 'http://yapi.ywwl.org',\n  outputFilePath: 'api',\n  projectId: '24',\n  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTY1MDYyMTUsImV4cCI6MTU1NzExMTAxNX0.ADmz2HEE6hKoe1DP_U2QtyKSSEURLf5soGKRNyJkX_o',\n  _yapi_uid: '18',\n  generateApiFileCode: (api) => {\n    const arr = [\n      `\n      /**\n      * ${api.title}\n      * ${api.markdown || ''}\n      **/\n      `,\n      \"import request from './../request'\",\n      'type Serve<T, G> = (data?: T) => Promise<G>',\n      api.requestInterface,\n      api.responseInterface,\n      `\n      export default (data?): Serve<\n        ${api.reqInterfaceName},\n        ${api.resInterfaceName}['data']\n      > => request({\n        method: '${api.method}',\n        url: '${api.path}',\n        data: ${(() => {\n          if (api.method.toLocaleLowerCase() === 'get') {\n            return '{params: data}'\n          } else {\n            return 'data'\n          }\n        })()}\n      })\n      `,\n    ]\n    return arr.join(`\n    `)\n  }\n}\n\nexport default config\n";
var viewHtmlTemplate = function viewHtmlTemplate(updateJson) {
  return "\n\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta http-equiv=\"X-UA-Compatible\" content=\"ie=edge\">\n  <title>Document</title>\n</head>\n<link rel=\"stylesheet\" href=\"https://cdn.bootcdn.net/ajax/libs/element-ui/2.12.0/theme-chalk/index.css\">\n<style>\n  body {\n    padding: 0 50px 50px;\n  }\n  .custom-tooltip {\n    width: 100% !important;\n    height: 10% !important;\n    position: absolute;\n    top: 0px;\n    left: 0px;\n  }\n\n  .custom-tooltip-item {\n    width: 350px;\n    height: 50px;\n    position: relative;\n    float: left;\n    margin-left: 20px;\n    border-left-style: solid;\n    border-left-width: 5px\n  }\n\n  .custom-tooltip-item:first-child {\n    margin-left: 0\n  }\n\n  .custom-tooltip-item-name {\n    width: 80%;\n    height: 20px;\n    position: absolute;\n    top: 0px;\n    left: 10px;\n    color: rgba(0, 0, 0, 0.45);\n    font-size: 14px\n  }\n\n  .custom-tooltip-item-value {\n    width: 80%;\n    height: 30px;\n    position: absolute;\n    bottom: 0px;\n    left: 10px;\n    color: #262626;\n    font-size: 18px;\n    /*font-weight: bold*/\n  }\n  #myChart {\n    width: 100%;\n    margin: 20px auto;\n    padding-top: 20px;\n    border-top: 1px dashed #ddd;\n  }\n  .table-wrap {\n    padding-top: 20px;\n    border-top: 1px dashed #ddd;\n  }\n  .color1 {\n    color: #E6A23C;\n  }\n  .color2 {\n    color: #67C23A;\n  }\n  .color3 {\n    color: #F56C6C;\n  }\n  .color4 {\n    color: #909399;\n  }\n  .el-tooltip__popper {\n    max-height: 500px;\n    overflow-y: auto;\n  }\n</style>\n<body>\n  <script src=\"https://gw.alipayobjects.com/os/antv/pkg/_antv.g2-3.5.1/dist/g2.min.js\"></script>\n  <script src=\"https://cdn.bootcdn.net/ajax/libs/vue/2.6.10/vue.min.js\"></script>\n  <script src=\"https://cdn.bootcdn.net/ajax/libs/element-ui/2.12.0/index.js\"></script>\n  <div id=\"app\">\n    <h2>API\u63A5\u53E3\u53D8\u66F4\u7EDF\u8BA1</h2>\n    <el-row>\n      <el-col :span=\"24\">\n        <div>\n          <el-date-picker\n            v-model=\"timeRange\"\n            type=\"datetimerange\"\n            :picker-options=\"pickerOptions2\"\n            range-separator=\"\u81F3\"\n            start-placeholder=\"\u5F00\u59CB\u65E5\u671F\"\n            end-placeholder=\"\u7ED3\u675F\u65E5\u671F\"\n            :default-time=\"['00:00:00', '23:59:59']\"\n            @change=\"getDate\"\n            align=\"right\">\n          </el-date-picker>\n        </div>\n        <div id=\"myChart\"></div>\n        <div class=\"table-wrap\">\n          <el-table\n            stripe\n            :data=\"tableData\"\n            style=\"width: 100%\">\n            <el-table-column\n              prop=\"time\"\n              label=\"\u65E5\u671F\"\n              sortable>\n            </el-table-column>\n            <el-table-column\n              label=\"API\u53D8\u66F4\">\n              <template slot-scope=\"scope\">\n                <div class=\"color1\">\n                  <div\n                    v-if=\"scope.row.modifiedFiles.length\"\n                    v-for=\"(item, index) in scope.row.modifiedFiles\"\n                    :key=\"index\">\n                    <el-tooltip\n                      effect=\"dark\"\n                      placement=\"top\">\n                      <div slot=\"content\" v-html=\"item.value\"></div>\n                      <div>{{item.name}}</div>\n                    </el-tooltip>\n                  </div>\n                  <div v-else>--</div>\n                </div>\n              </template>\n            </el-table-column>\n            <el-table-column label=\"API\u65B0\u589E\">\n              <template slot-scope=\"scope\">\n                <div class=\"color2\">\n                  <div\n                    v-if=\"scope.row.addedFiles\"\n                    v-for=\"(item, index) in scope.row.addedFiles\" :key=\"index\">\n                    <el-tooltip\n                      effect=\"dark\"\n                      placement=\"top\">\n                      <div slot=\"content\" v-html=\"item.value\"></div>\n                      <div>{{item.name}}</div>\n                    </el-tooltip>\n                  </div>\n                  <div v-else>--</div>\n                </div>\n              </template>\n            </el-table-column>\n            <el-table-column label=\"API\u5220\u9664\">\n              <template slot-scope=\"scope\">\n                <div class=\"color3\">\n                  <div\n                    v-if=\"scope.row.deletedFiles\"\n                    v-for=\"(item, index) in scope.row.deletedFiles\" :key=\"index\">{{item.name}}</div>\n                  <div v-else>--</div>\n                </div>\n              </template>\n            </el-table-column>\n          </el-table>\n        </div>\n      </el-col>\n    </el-row>\n  </div>\n</body>\n</html>\n<script>\n  let baseData = ".concat(updateJson, "\n  const times = new Date().getTime() + 24 * 60 * 60 * 1000\n\n  new Vue({\n    el: '#app',\n    data: function() {\n      return {\n        dataArr: [],\n        copyData: [],\n        timeRange: '',\n        pickerOptions2: {\n          shortcuts: [{\n            text: '\u6700\u8FD1\u4E00\u5468',\n            onClick(picker) {\n              const end = new Date();\n              const start = new Date();\n              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);\n              picker.$emit('pick', [start, end]);\n            }\n          }, {\n            text: '\u6700\u8FD1\u4E00\u4E2A\u6708',\n            onClick(picker) {\n              const end = new Date();\n              const start = new Date();\n              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);\n              picker.$emit('pick', [start, end]);\n            }\n          }, {\n            text: '\u6700\u8FD1\u4E09\u4E2A\u6708',\n            onClick(picker) {\n              const end = new Date();\n              const start = new Date();\n              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);\n              picker.$emit('pick', [start, end]);\n            }\n          }],\n          disabledDate(time) {\n            return time.getTime() >= times\n          }\n        },\n        tableData: [],\n        chart: null\n      }\n    },\n    mounted() {\n      this.handleAllData(baseData)\n      this.initChart(this.dataArr)\n    },\n    methods: {\n      jsonToArr(obj) {\n        let arr = []\n        for (let i in obj) {\n          let item = {}\n          item.name = i\n          obj[i] = obj[i].replace(/\\n/g, '<br>')\n          item.value = obj[i]\n          arr.push(item)\n        }\n        return arr\n      },\n      handleTableArr(obj) {\n        let tableObj = {}\n        tableObj.time = new Date(obj.time).toLocaleString()\n        tableObj.modifiedFiles = this.jsonToArr(obj.modifiedFiles)\n        tableObj.addedFiles = this.jsonToArr(obj.addedFiles)\n        tableObj.deletedFiles = this.jsonToArr(obj.deletedFiles)\n        this.tableData.push(tableObj)\n        this.tableData.reverse()\n      },\n      // \u5168\u90E8\u6570\u636E\n      handleAllData(data) {\n        this.dataArr = []\n        this.tableData = []\n        data.forEach(item => {\n          let obj = {}, obj1 = {}, obj2 = {}\n          obj.date = new Date(item.time).toLocaleString()\n          obj.type = 'modifiedFiles'\n          obj.value = Object.keys(item.modifiedFiles).length\n\n          obj1.date = new Date(item.time).toLocaleString()\n          obj1.type = 'addedFiles'\n          obj1.value = Object.keys(item.addedFiles).length\n\n          obj2.date = new Date(item.time).toLocaleString()\n          obj2.type = 'deletedFiles'\n          obj2.value = Object.keys(item.deletedFiles).length\n\n          this.dataArr.push(obj)\n          this.dataArr.push(obj1)\n          this.dataArr.push(obj2)\n\n          this.handleTableArr(item)\n        })\n        console.log(this.tableData, 8877)\n      },\n      // \u65E5\u671F\u7B5B\u9009\u6570\u636E\n      handleFilterData() {\n        this.copyData = []\n        let startTime = new Date(this.timeRange[0]).getTime()\n        let endTime = new Date(this.timeRange[1]).getTime()\n        baseData.forEach(item => {\n          let time = new Date(item.time).getTime()\n          if (time < endTime && time > startTime) {\n            this.copyData.push(item)\n          }\n        })\n        this.handleAllData(this.copyData)\n      },\n      getDate() {\n        if (this.timeRange) {\n          this.handleFilterData()\n          this.chart.destroy()\n          this.initChart(this.dataArr)\n        } else {\n          this.handleAllData(baseData)\n          this.chart.destroy()\n          this.initChart(this.dataArr)\n        }\n      },\n      initChart(data) {\n        this.chart = new G2.Chart({\n          container: 'myChart',\n          forceFit: true,\n          height: 400,\n          padding: [100, 100, 50,50] // \u4E0A\u53F3\u4E0B\u5DE6\n        })\n        this.chart.source(data)\n        this.chart.tooltip({\n          follow: false,\n          crosshairs: 'y',\n          htmlContent: function htmlContent(title, items) {\n            var alias = {\n              modifiedFiles: 'API\u53D8\u66F4\u6570\u91CF(\u65E5\u671F/\u6570\u91CF)',\n              addedFiles: 'API\u65B0\u589E\u6570\u91CF(\u65E5\u671F/\u6570\u91CF)',\n              deletedFiles: 'API\u5220\u9664\u6570\u91CF(\u65E5\u671F/\u6570\u91CF)'\n            }\n            var html = '<div class=\"custom-tooltip\">'\n            for (var i = 0; i < items.length; i++) {\n              console.log(item, 4444)\n              var item = items[i];\n              var color = item.color;\n              var name = alias[item.name];\n              var value = item.title+'/'+item.value;\n              var domHead = '<div class=\"custom-tooltip-item\" style=\"border-left-color:' + color + '\">'\n              var domName = '<div class=\"custom-tooltip-item-name\">' + name + '</div>'\n              var domValue = '<div class=\"custom-tooltip-item-value\">' + value + '</div>'\n              var domTail = '</div>'\n              html += domHead + domName + domValue + domTail\n            }\n            return html + '</div>'\n          }\n        })\n        this.chart.axis('date', {\n          label: {\n            textStyle: {\n              fill: '#aaaaaa'\n            }\n          }\n        })\n        this.chart.axis('value', {\n          label: {\n            textStyle: {\n              fill: '#aaaaaa'\n            },\n            formatter: function formatter(text) {\n              return text.replace(/(d)(?=(?:d{3})+$)/g, '$1,')\n            }\n          }\n        })\n        this.chart.legend(false)\n        this.chart.line().position('date*value').color('type', ['#67C23A', '#E6A23C', '#F56C6C', '#909399'])\n        this.chart.render()\n        this.chart.showTooltip({\n          x: document.getElementById(\"myChart\").clientWidth - 20,\n          y: 100\n        })\n      }\n    }\n  })\n</script>");
};

function _empty() {}

var pkg = require('./../package.json');

function _awaitIgnored(value, direct) {
  if (!direct) {
    return value && value.then ? value.then(_empty) : Promise.resolve();
  }
}

var openChangelog = function openChangelog(outputFilePath) {
  // 打开变动视图
  var app = express();
  var updateJson = fs.readFileSync(resolveApp("".concat(outputFilePath, "/update.json"))).toString();
  var port = Math.ceil(Math.random() * 10000);
  app.listen(port, function () {
    var uri = "http://localhost:".concat(port);
    console.log("\u53D8\u66F4\u65E5\u5FD7\uFF1A".concat(uri));
    open(uri);
    app.get('/', function (req, res) {
      res.send(viewHtmlTemplate(updateJson));
    });
  });
};

function _await$3(value, then, direct) {
  if (direct) {
    return then ? then(value) : value;
  }

  if (!value || !value.then) {
    value = Promise.resolve(value);
  }

  return then ? value.then(then) : value;
}

function _catch$2(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

function _continueIgnored(value) {
  if (value && value.then) {
    return value.then(_empty);
  }
}

function _invoke$1(body, then) {
  var result = body();

  if (result && result.then) {
    return result.then(then);
  }

  return then(result);
}

function _async$3(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var _iteratorSymbol = /*#__PURE__*/typeof Symbol !== "undefined" ? Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator")) : "@@iterator";

function _settle(pact, state, value) {
  if (!pact.s) {
    if (value instanceof _Pact) {
      if (value.s) {
        if (state & 1) {
          state = value.s;
        }

        value = value.v;
      } else {
        value.o = _settle.bind(null, pact, state);
        return;
      }
    }

    if (value && value.then) {
      value.then(_settle.bind(null, pact, state), _settle.bind(null, pact, 2));
      return;
    }

    pact.s = state;
    pact.v = value;
    var observer = pact.o;

    if (observer) {
      observer(pact);
    }
  }
}

var _Pact = /*#__PURE__*/function () {
  function _Pact() {}

  _Pact.prototype.then = function (onFulfilled, onRejected) {
    var result = new _Pact();
    var state = this.s;

    if (state) {
      var callback = state & 1 ? onFulfilled : onRejected;

      if (callback) {
        try {
          _settle(result, 1, callback(this.v));
        } catch (e) {
          _settle(result, 2, e);
        }

        return result;
      } else {
        return this;
      }
    }

    this.o = function (_this) {
      try {
        var value = _this.v;

        if (_this.s & 1) {
          _settle(result, 1, onFulfilled ? onFulfilled(value) : value);
        } else if (onRejected) {
          _settle(result, 1, onRejected(value));
        } else {
          _settle(result, 2, value);
        }
      } catch (e) {
        _settle(result, 2, e);
      }
    };

    return result;
  };

  return _Pact;
}();

function _isSettledPact(thenable) {
  return thenable instanceof _Pact && thenable.s & 1;
}

function _forTo(array, body, check) {
  var i = -1,
      pact,
      reject;

  function _cycle(result) {
    try {
      while (++i < array.length && (!check || !check())) {
        result = body(i);

        if (result && result.then) {
          if (_isSettledPact(result)) {
            result = result.v;
          } else {
            result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
            return;
          }
        }
      }

      if (pact) {
        _settle(pact, 1, result);
      } else {
        pact = result;
      }
    } catch (e) {
      _settle(pact || (pact = new _Pact()), 2, e);
    }
  }

  _cycle();

  return pact;
}

function _forOf(target, body, check) {
  if (typeof target[_iteratorSymbol] === "function") {
    var _cycle = function _cycle(result) {
      try {
        while (!(step = iterator.next()).done && (!check || !check())) {
          result = body(step.value);

          if (result && result.then) {
            if (_isSettledPact(result)) {
              result = result.v;
            } else {
              result.then(_cycle, reject || (reject = _settle.bind(null, pact = new _Pact(), 2)));
              return;
            }
          }
        }

        if (pact) {
          _settle(pact, 1, result);
        } else {
          pact = result;
        }
      } catch (e) {
        _settle(pact || (pact = new _Pact()), 2, e);
      }
    };

    var iterator = target[_iteratorSymbol](),
        step,
        pact,
        reject;

    _cycle();

    if (iterator["return"]) {
      var _fixup = function _fixup(value) {
        try {
          if (!step.done) {
            iterator["return"]();
          }
        } catch (e) {}

        return value;
      };

      if (pact && pact.then) {
        return pact.then(_fixup, function (e) {
          throw _fixup(e);
        });
      }

      _fixup();
    }

    return pact;
  } // No support for Symbol.iterator


  if (!("length" in target)) {
    throw new TypeError("Object is not iterable");
  } // Handle live collections properly


  var values = [];

  for (var i = 0; i < target.length; i++) {
    values.push(target[i]);
  }

  return _forTo(values, function (i) {
    return body(values[i]);
  }, check);
}

function _switch(discriminant, cases) {
  var dispatchIndex = -1;
  var awaitBody;

  outer: {
    for (var i = 0; i < cases.length; i++) {
      var test = cases[i][0];

      if (test) {
        var testValue = test();

        if (testValue && testValue.then) {
          break outer;
        }

        if (testValue === discriminant) {
          dispatchIndex = i;
          break;
        }
      } else {
        // Found the default case, set it as the pending dispatch case
        dispatchIndex = i;
      }
    }

    if (dispatchIndex !== -1) {
      do {
        var body = cases[dispatchIndex][1];

        while (!body) {
          dispatchIndex++;
          body = cases[dispatchIndex][1];
        }

        var result = body();

        if (result && result.then) {
          awaitBody = true;
          break outer;
        }

        var fallthroughCheck = cases[dispatchIndex][2];
        dispatchIndex++;
      } while (fallthroughCheck && !fallthroughCheck());

      return result;
    }
  }

  var pact = new _Pact();

  var reject = _settle.bind(null, pact, 2);

  (awaitBody ? result.then(_resumeAfterBody) : testValue.then(_resumeAfterTest)).then(void 0, reject);
  return pact;

  function _resumeAfterTest(value) {
    for (;;) {
      if (value === discriminant) {
        dispatchIndex = i;
        break;
      }

      if (++i === cases.length) {
        if (dispatchIndex !== -1) {
          break;
        } else {
          _settle(pact, 1, result);

          return;
        }
      }

      test = cases[i][0];

      if (test) {
        value = test();

        if (value && value.then) {
          value.then(_resumeAfterTest).then(void 0, reject);
          return;
        }
      } else {
        dispatchIndex = i;
      }
    }

    do {
      var body = cases[dispatchIndex][1];

      while (!body) {
        dispatchIndex++;
        body = cases[dispatchIndex][1];
      }

      var result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
        return;
      }

      var fallthroughCheck = cases[dispatchIndex][2];
      dispatchIndex++;
    } while (fallthroughCheck && !fallthroughCheck());

    _settle(pact, 1, result);
  }

  function _resumeAfterBody(result) {
    for (;;) {
      var fallthroughCheck = cases[dispatchIndex][2];

      if (!fallthroughCheck || fallthroughCheck()) {
        break;
      }

      dispatchIndex++;
      var body = cases[dispatchIndex][1];

      while (!body) {
        dispatchIndex++;
        body = cases[dispatchIndex][1];
      }

      result = body();

      if (result && result.then) {
        result.then(_resumeAfterBody).then(void 0, reject);
        return;
      }
    }

    _settle(pact, 1, result);
  }
}

TSNode.register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

var generatoraFiles = _async$3(function (config) {
  var generator = new Generator(config); // 登陆获取token

  return _invoke$1(function () {
    if (!login.isLogin()) {
      return _awaitIgnored(login.run(config.serverUrl));
    }
  }, function () {
    var spinner = ora('🛫 正在获取yapi数据样本').start();
    return _continueIgnored(_catch$2(function () {
      return _await$3(generator.generate(), function (output) {
        spinner.info("\uD83C\uDF08 \u5F00\u59CB\u5199\u5165project: ".concat(config.projectId)); // consola.success('yapi数据成功获取')

        generator.write(output, function (isNew) {
          spinner.stop();

          if (isNew && config.changelog) {
            config.generateUpdateJson && openChangelog(config.outputFilePath);
          }
        });
      });
    }, function () {
      spinner.stop();
    }));
  });
});

_async$3(function () {
  var configFile = path.join(process.cwd(), 'yapiMagic.config.ts');

  if (!fs.pathExistsSync(configFile)) {
    configFile = path.join(process.cwd(), 'yapiMagic.config.js');
  }

  cli.version(pkg.version).arguments('[cmd]').action(_async$3(function (cmd) {
    return _switch(cmd, [[function () {
      return 'init';
    }, function () {
      return _await$3(fs.pathExists(configFile), function (_fs$pathExists) {
        return _invoke$1(function () {
          if (_fs$pathExists) {
            consola.info("\u68C0\u6D4B\u5230\u914D\u7F6E\u6587\u4EF6: ".concat(configFile));
            return _await$3(prompt({
              type: 'confirm',
              name: 'override',
              message: '是否覆盖已有配置文件?'
            }), function (answers) {
              if (!answers.override) ;
            });
          }
        }, function (_result2) {
          return  _await$3(fs.outputFile(configFile, configTemplate), function () {
            consola.success('写入配置文件完毕');
          });
        });
      });
    }], [function () {
      return 'changelog';
    }, function () {
      var config = require(configFile);

      config = config["default"] || config;

      if (Object.prototype.toString.call(config) === '[object Array]') {
        // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
        config.forEach(function (configItem) {
          openChangelog(configItem.outputFilePath);
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
        openChangelog(config.outputFilePath);
      }
    }], [function () {
      return 'version';
    }, function () {
      console.log("\u5F53\u524D yapiMagic \u7248\u672C\u53F7 ".concat(pkg.version));
    }], [function () {
      return 'clear';
    }, function () {
      fs.remove(path.join(__dirname, '.yapiUser'));
    }], [void 0, function () {
      return _await$3(fs.pathExists(configFile), function (_fs$pathExists2) {
        if (!_fs$pathExists2) {
          var _consola$error2 = consola.error("\u627E\u4E0D\u5230\u914D\u7F6E\u6587\u4EF6: ".concat(configFile));
          return _consola$error2;
        }

        consola.success("\u627E\u5230\u914D\u7F6E\u6587\u4EF6: ".concat(configFile));
        return _catch$2(function () {
          var config = require(configFile);

          config = config["default"] || config; // console.log(config)

          if (Object.prototype.toString.call(config) !== '[object Array]') {
            config = [config];
          }

          return _continueIgnored(_forOf(config, function (configItem) {
            return _awaitIgnored(generatoraFiles(configItem));
          }));
        }, function (err) {
          return consola.error(err);
        });
      });
    }]]);
  })).parse(process.argv);
})();
