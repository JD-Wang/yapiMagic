"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const consola_1 = tslib_1.__importDefault(require("consola"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const request_promise_native_1 = tslib_1.__importDefault(require("request-promise-native"));
// 存储账号密码的文件
const fileDir = path_1.default.join(__dirname, '.yapiUser');
const userLogin = async function (email, password, serverUrl) {
    const req = {
        email,
        password,
    };
    try {
        const res = await request_promise_native_1.default({
            method: "POST",
            uri: `${serverUrl}/api/user/login`,
            body: req,
            json: true,
            resolveWithFullResponse: true,
        });
        const [cookie0, cookie1] = res.headers["set-cookie"];
        const _yapi_token = cookie0.split(";")[0].split("=")[1];
        const _yapi_uid = cookie1.split(";")[0].split("=")[1];
        consola_1.default.success("账户已登录");
        // 写入文件
        writeUserInfo(req);
        return {
            _yapi_token,
            _yapi_uid,
        };
    }
    catch (e) {
        consola_1.default.error("登录失败");
        return Promise.reject(e);
    }
};
function writeUserInfo(data) {
    try {
        fs_extra_1.default.writeFile(fileDir, JSON.stringify(data), function (err) {
            if (err) {
                consola_1.default.error(`文件写入失败`);
            }
        });
    }
    catch (error) {
        consola_1.default.error(`文件写入失败`);
    }
}
const getToken = async function (serverUrl) {
    // 获取配置中的账号密码
    const USER_HOME = (process.env.HOME || process.env.USERPROFILE);
    let email = '';
    let password = '';
    if (fs_extra_1.default.existsSync(fileDir)) {
        const conf = JSON.parse(fs_extra_1.default.readFileSync(fileDir, "utf-8"));
        email = conf.email;
        password = conf.password;
    }
    else {
        consola_1.default.warn(`未登陆, 请执行 yapiMagic login 进行登陆`);
        const conf = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "email",
                message: "请输入账号:",
            },
            {
                type: "input",
                name: "password",
                message: "请输入密码:",
            }
        ]);
        email = conf.email;
        password = conf.password;
    }
    // 自动登录
    return userLogin(email, password, serverUrl);
};
exports.default = getToken;
