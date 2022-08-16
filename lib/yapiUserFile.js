"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const consola_1 = tslib_1.__importDefault(require("consola"));
// 获取配置中的账号密码
const USER_HOME = (process.env.HOME || process.env.USERPROFILE);
// 存储账号密码的文件，根据server不同存储
class GetYapiUserFile {
    constructor() {
        this.yapiUserFile = '';
    }
    setServer(server) {
        const host = new URL(server).host;
        this.yapiUserFile = path_1.default.resolve(USER_HOME, `${host}.yapiUserFile`);
    }
    getPath() {
        return this.yapiUserFile;
    }
    saveFile(data) {
        try {
            fs_extra_1.default.writeFile(this.yapiUserFile, JSON.stringify(data), function (err) {
                if (err) {
                    consola_1.default.error(`文件写入失败`);
                }
            });
        }
        catch (error) {
            consola_1.default.error(`文件写入失败`);
        }
    }
    deleteFile() {
        try {
            fs_extra_1.default.remove(this.yapiUserFile);
        }
        catch (error) {
            consola_1.default.error(`删除文件失败`);
        }
    }
}
exports.default = new GetYapiUserFile();
