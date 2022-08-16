import inquirer from 'inquirer'
import consola from 'consola'
import fs from 'fs-extra'
import request from 'request-promise-native'
import yapiUser from './yapiUserFile'

const userLogin = async function (
    email: String,
    password: String,
    serverUrl: string
): Promise<{
    _yapi_token: String
    _yapi_uid: String
}> {
    const req = {
        email,
        password
    }
    try {
        const res = await request({
            method: 'POST',
            uri: `${serverUrl}/api/user/login`,
            body: req,
            json: true,
            resolveWithFullResponse: true
        })
        // 登录失败
        if (res.body.errcode) {
            if (res.body.errmsg === '该用户不存在') {
              yapiUser.deleteFile()
            }
            return Promise.reject(res.body.errmsg)
        }
        const [cookie0, cookie1] = res.headers['set-cookie']
        const _yapi_token = cookie0.split(';')[0].split('=')[1]
        const _yapi_uid = cookie1.split(';')[0].split('=')[1]
        consola.success(`${serverUrl} 账户登录成功`)
        // 写入文件
        yapiUser.saveFile(req)
        return {
            _yapi_token,
            _yapi_uid
        }
    } catch (e) {
        consola.error('登录失败')
        process.exit(0)
    }
}


const requestToken = async function (serverUrl: string): Promise<{
    _yapi_token: String
    _yapi_uid: String
}> {
    // 获取配置中的账号密码
    let email = ''
    let password = ''
    const yapiUserFile = yapiUser.getPath()
    if (fs.existsSync(yapiUserFile)) {
        try {
            const conf = JSON.parse(fs.readFileSync(yapiUserFile, 'utf-8'))
            email = conf.email
            password = conf.password
        } catch (error) {}
    }
    if (!email || !password) {
        consola.warn(`${serverUrl} 未登陆, 请输入账号密码登陆`)

        const conf = await inquirer.prompt([
            {
                type: 'input', // 类型
                name: 'email', // 字段名称，在then里可以打印出来
                message: '请输入账号:' // 提示信息
            },
            {
                type: 'input', // 类型
                name: 'password', // 字段名称，在then里可以打印出来
                message: '请输入密码:' // 提示信息
            }
        ])

        email = conf.email
        password = conf.password
    }
    // 自动登录
    return userLogin(email, password, serverUrl)
}

class Login {
    _yapi_token: String
    _yapi_uid: String
    constructor() {
        this._yapi_token = ''
        this._yapi_uid = ''
    }

    async run(serverUrl: string) {
        const { _yapi_token, _yapi_uid } = await requestToken(serverUrl)
        this._yapi_token = _yapi_token
        this._yapi_uid = _yapi_uid
    }

    isLogin() {
        return !!this._yapi_token
    }

    getToken() {
        if (!this._yapi_token || !this._yapi_uid) {
            consola.warn('没有登陆，请重新执行')
            process.exit(0)
        }
        return {
            _yapi_token: this._yapi_token,
            _yapi_uid: this._yapi_uid
        }
    }
}

export default new Login()
