"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRequestData = exports.FileData = void 0;
class FileData {
    /**
     * 文件数据辅助类，统一网页、小程序等平台的文件上传。
     *
     * @param originalFileData 原始文件数据
     */
    constructor(originalFileData) {
        this.originalFileData = originalFileData;
    }
    /**
     * 获取原始文件数据。
     *
     * @returns 原始文件数据
     */
    getOriginalFileData() {
        return this.originalFileData;
    }
}
exports.FileData = FileData;
/**
 * 解析请求数据，从请求数据中分离出普通数据和文件数据。
 *
 * @param requestData 要解析的请求数据
 * @returns 包含普通数据(data)和文件数据(fileData)的对象，data、fileData 为空对象时，表示没有此类数据
 */
function parseRequestData(requestData) {
    const result = {
        data: {},
        fileData: {},
    };
    if (requestData != null && typeof requestData === 'object') {
        Object.keys(requestData).forEach(key => {
            if (requestData[key] && requestData[key] instanceof FileData) {
                result.fileData[key] = requestData[key].getOriginalFileData();
            }
            else {
                result.data[key] = requestData[key];
            }
        });
    }
    return result;
}
exports.parseRequestData = parseRequestData;
