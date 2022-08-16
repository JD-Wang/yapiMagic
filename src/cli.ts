#!/usr/bin/env node
import * as TSNode from 'ts-node'
import cli from 'commander'
import consola from 'consola'
import express from 'express'
import fs from 'fs-extra'
import open from 'open'
import ora from 'ora'
import path from 'path'
import prompt from 'prompts'
import { Config, ServerConfig } from './types'
import { Generator } from './Generator/index'
import login from './login'
import { resolveApp } from './utils'
import yapiUser from './yapiUserFile'
import { configTemplate, viewHtmlTemplate } from './template'
const pkg = require('./../package.json')

const openChangelog = (outputFilePath: string) => {
    // 打开变动视图
    const app = express()
    const updateJson = fs.readFileSync(resolveApp(`${outputFilePath}/update.json`)).toString()
    const port = Math.ceil(Math.random() * 10000)
    app.listen(port, () => {
        const uri = `http://localhost:${port}`
        console.log(`变更日志：${uri}`)
        open(uri)
        app.get('/', (req, res) => {
            res.send(viewHtmlTemplate(updateJson))
        })
    })
}

TSNode.register({
    transpileOnly: true,
    compilerOptions: {
        module: 'commonjs'
    }
})

const generatoraFiles = async (config: ServerConfig) => {
    const generator = new Generator(config)

    // 登陆获取token
    if (!login.isLogin()) {
        yapiUser.setServer(config.serverUrl)
        await login.run(config.serverUrl)
    }

    const spinner = ora(`🛫 正在获取project: ${config.projectId} 的yapi数据样本`).start()
    try {
        const output = await generator.generate()
        spinner.info(`🌈 开始写入project: ${config.projectId}`)
        // consola.success('yapi数据成功获取')
        generator.write(output, function (isNew) {
            spinner.stop()
            if (isNew && config.changelog) {
                config.generateUpdateJson && openChangelog(config.outputFilePath)
            }
        })
    } catch (e) {
        spinner.stop()
    }
}

;(async () => {
    let configFile = path.join(process.cwd(), 'yapiMagic.config.ts')
    if (!fs.pathExistsSync(configFile)) {
        configFile = path.join(process.cwd(), 'yapiMagic.config.js')
    }

    cli.version(pkg.version)
        .arguments('[cmd]')
        .action(async cmd => {
            switch (cmd) {
                case 'init':
                    if (await fs.pathExists(configFile)) {
                        consola.info(`检测到配置文件: ${configFile}`)
                        const answers = await prompt({
                            type: 'confirm',
                            name: 'override',
                            message: '是否覆盖已有配置文件?'
                        })
                        if (!answers.override) return
                    }

                    await fs.outputFile(configFile, configTemplate)
                    consola.success('写入配置文件完毕')
                    break

                case 'changelog':
                    let config = require(configFile)
                    config = config.default || config
                    if (Object.prototype.toString.call(config) === '[object Array]') {
                        // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
                        ;(<ServerConfig[]>config).forEach(configItem => {
                            openChangelog(configItem.outputFilePath)
                        })
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-angle-bracket-type-assertion
                        openChangelog((<ServerConfig>config).outputFilePath)
                    }
                    break

                case 'version':
                    console.log(`当前 yapiMagic 版本号 ${pkg.version}`)
                    break

                default:
                    if (!(await fs.pathExists(configFile))) {
                        return consola.error(`找不到配置文件: ${configFile}`)
                    }
                    consola.success(`找到配置文件: ${configFile}`)
                    try {
                        let config = require(configFile)
                        config = config.default || config
                        // console.log(config)
                        if (Object.prototype.toString.call(config) !== '[object Array]') {
                            config = [config]
                        }
                        for (let configItem of config) {
                            await generatoraFiles(configItem)
                        }
                    } catch (err) {
                        return consola.error(err)
                    }
                    break
            }
        })
        .parse(process.argv)
})()
