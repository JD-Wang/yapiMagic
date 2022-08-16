import path from 'path'
import fs from 'fs-extra'
import consola from 'consola'
// 获取配置中的账号密码
const USER_HOME = (process.env.HOME || process.env.USERPROFILE) as string

// 存储账号密码的文件，根据server不同存储
class GetYapiUserFile {
    yapiUserFile: string
    constructor() {
        this.yapiUserFile = ''
    }
    setServer(server: string) {
        const host = new URL(server).host
        this.yapiUserFile = path.resolve(USER_HOME, `${host}.yapiUserFile`)
    }
    getPath(): string {
        return this.yapiUserFile
    }
    saveFile(data: any) {
        try {
            fs.writeFile(this.yapiUserFile, JSON.stringify(data), function (err) {
                if (err) {
                    consola.error(`文件写入失败`)
                }
            })
        } catch (error) {
            consola.error(`文件写入失败`)
        }
    }
    deleteFile() {
        try {
            fs.remove(this.yapiUserFile)
        } catch (error) {
            consola.error(`删除文件失败`)
        }
    }
}
export default new GetYapiUserFile()
