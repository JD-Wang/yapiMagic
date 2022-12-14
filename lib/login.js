"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const consola_1 = tslib_1.__importDefault(require("consola"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const request_promise_native_1 = tslib_1.__importDefault(require("request-promise-native"));
const yapiUserFile_1 = tslib_1.__importDefault(require("./yapiUserFile"));
const userLogin = async function (email, password, serverUrl) {
    const req = {
        email,
        password
    };
    try {
        const res = await (0, request_promise_native_1.default)({
            method: 'POST',
            uri: `${serverUrl}/api/user/login`,
            body: req,
            json: true,
            resolveWithFullResponse: true
        });
        // 登录失败
        if (res.body.errcode) {
            if (res.body.errmsg === '该用户不存在') {
                yapiUserFile_1.default.deleteFile();
            }
            return Promise.reject(res.body.errmsg);
        }
        const [cookie0, cookie1] = res.headers['set-cookie'];
        const _yapi_token = cookie0.split(';')[0].split('=')[1];
        const _yapi_uid = cookie1.split(';')[0].split('=')[1];
        consola_1.default.success(`${serverUrl} 账户登录成功`);
        // 写入文件
        yapiUserFile_1.default.saveFile(req);
        return {
            _yapi_token,
            _yapi_uid
        };
    }
    catch (e) {
        consola_1.default.error('登录失败');
        process.exit(0);
    }
};
const requestToken = async function (serverUrl) {
    // 获取配置中的账号密码
    let email = '';
    let password = '';
    const yapiUserFile = yapiUserFile_1.default.getPath();
    if (fs_extra_1.default.existsSync(yapiUserFile)) {
        try {
            const conf = JSON.parse(fs_extra_1.default.readFileSync(yapiUserFile, 'utf-8'));
            email = conf.email;
            password = conf.password;
        }
        catch (error) { }
    }
    if (!email || !password) {
        consola_1.default.warn(`${serverUrl} 未登陆, 请输入账号密码登陆`);
        const conf = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'email',
                message: '请输入账号:' // 提示信息
            },
            {
                type: 'input',
                name: 'password',
                message: '请输入密码:' // 提示信息
            }
        ]);
        email = conf.email;
        password = conf.password;
    }
    // 自动登录
    return userLogin(email, password, serverUrl);
};
class Login {
    constructor() {
        this._yapi_token = '';
        this._yapi_uid = '';
    }
    async run(serverUrl) {
        const { _yapi_token, _yapi_uid } = await requestToken(serverUrl);
        this._yapi_token = _yapi_token;
        this._yapi_uid = _yapi_uid;
    }
    isLogin() {
        return !!this._yapi_token;
    }
    getCookie() {
        if (!this._yapi_token || !this._yapi_uid) {
            consola_1.default.warn('没有登陆，请重新执行');
            process.exit(0);
        }
        return `_yapi_token=${this._yapi_token};_yapi_uid=${this._yapi_uid}`;
    }
}
exports.default = new Login();
