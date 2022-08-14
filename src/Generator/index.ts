import * as changeCase from 'change-case'
import _ from 'lodash'
import consola from 'consola'
import fs from 'fs-extra'
import gitDiff from 'git-diff'
import JSON5 from 'json5'
import prettier from 'prettier'
import request from 'request-promise-native'
import { execSync } from 'child_process'
import { JSONSchema4 } from 'json-schema'
import login from '../login'

import * as Types from './../types'

import { jsonSchemaStringToJsonSchema, jsonSchemaToType, jsonToJsonSchema, mkdirs, mockjsTemplateToJsonSchema, propDefinitionsToJsonSchema, resolveApp, throwError, writeFileSync } from './../utils'
import { threadId } from 'worker_threads'

const readGitStatus = () => {
  // const root = path.resolve(__dirname, '../../')
  // 获取git 工作区状态
  const stdout = execSync('git status --porcelain', {
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString().trim()
  const isGitWorkspaceEmpty = stdout === ''
  // 获取当前分支名称
  const branchName = execSync('git symbolic-ref --short -q HEAD').toString().trim()
  // console.log(`分支: ${branchName} git 工作区 ${isGitWorkspaceEmpty}`)
  return {
    isGitWorkspaceEmpty,
    branchName,
  }
}

const {
  branchName,
  isGitWorkspaceEmpty,
} = readGitStatus()

export class Generator {
  config: Types.ServerConfig

  deletedFiles: Types.IFiles = {}

  modifiedFiles: Types.IFiles = {}

  addedFiles: Types.IFiles = {}

  unModifiedFiles: string[] = []

  serverUrl: string

  readonly ignoreFiles: string[] = [
    'update.log',
    'update.json',
    'index.ts',
    'index.js',
  ]

  constructor(config: Types.ServerConfig) {
    this.config = config
    this.serverUrl = ''
  }

  async fetchApi(projectConfig = this.config): Promise<Types.ApiJson> {
    // if (!isGitWorkspaceEmpty && !this.config.notCheckGit) {
    //   consola.error(`请先处理git工作区未提交文件，再运行 yapiMagic`)
    //   process.exit(0)
    // }
    // 登录 获取用户信息
    const {
      projectId, serverUrl,
    } = projectConfig

    this.serverUrl = serverUrl

    // 获取api
    const url = `${serverUrl}/api/plugin/export?type=json&pid=${projectId}&status=all&isWiki=false`

    const { _yapi_token, _yapi_uid } = login.getToken()

    const headers = {
      Cookie: `_yapi_token=${_yapi_token};_yapi_uid=${_yapi_uid}`,
    }

    const res = await request.get(url, {
      json: true,
      headers: headers,
    })
    return res
  }

  /** 生成请求数据类型 */
  async generateRequestDataType(interfaceInfo: Types.Interface, typeName: string): Promise<string> {
    let jsonSchema: JSONSchema4 = {}
    switch (interfaceInfo.method) {
      case Types.Method.GET:
      case Types.Method.HEAD:
      case Types.Method.OPTIONS:
        jsonSchema = propDefinitionsToJsonSchema(
          interfaceInfo.req_query.map<Types.PropDefinition>(item => ({
            name: item.name,
            required: item.required === Types.Required.true,
            type: 'string',
            comment: item.desc,
          })),
        )
        break

      default:
        switch (interfaceInfo.req_body_type) {
          case Types.RequestBodyType.form:
            jsonSchema = propDefinitionsToJsonSchema(
              interfaceInfo.req_body_form.map<Types.PropDefinition>(item => ({
                name: item.name,
                required: item.required === Types.Required.true,
                type: (item.type === Types.RequestFormItemType.file ? 'file' : 'string') as any,
                comment: item.desc,
              })),
            )
            break

          case Types.RequestBodyType.json:
            if (interfaceInfo.req_body_other) {
              jsonSchema = interfaceInfo.req_body_is_json_schema ? jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other) : jsonToJsonSchema(JSON5.parse(interfaceInfo.req_body_other))
            }
            break
          default:
            break
        }
        break
    }

    return jsonSchemaToType(jsonSchema, typeName)
  }

  /** 生成响应数据类型 */
  async generateResponseDataType(
    { interfaceInfo, typeName, dataKey }: {
      interfaceInfo: Types.Interface,
      typeName: string,
      dataKey?: string,
    },
  ): Promise<string> {
    let jsonSchema: JSONSchema4 = {}

    switch (interfaceInfo.res_body_type) {
      case Types.ResponseBodyType.json:
        if (interfaceInfo.res_body) {
          jsonSchema = interfaceInfo.res_body_is_json_schema
            ? jsonSchemaStringToJsonSchema(interfaceInfo.res_body)
            : mockjsTemplateToJsonSchema(JSON5.parse(interfaceInfo.res_body))
        }
        break
      default:
        return `export type ${typeName} = any`
    }

    if (dataKey && jsonSchema && jsonSchema.properties && jsonSchema.properties[dataKey]) {
      jsonSchema = jsonSchema.properties[dataKey]
    }

    return jsonSchemaToType(jsonSchema, typeName)
  }

  async generate() {
    if (!isGitWorkspaceEmpty) {
      consola.error('检测到您git工作区存在未提交文件，请先处理')
      return Promise.reject()
    }
    try {
      const res = await this.fetchApi()
      // const {
      //   include: includeCatIds,
      //   exclude: excludeCatIds,
      // }= this.config.catid || { include: null, exclude: null }
      // TODO: customizeFilter
      const { customizeFilter } = this.config
      const filesDesc = await Promise.all(res.map(async catItem => {
        const { list, ...rest } = catItem
        // customizeFilter 过滤掉 不生成的接口
        const listCustomizeFilter = list.filter(file => {
          const { _id, path } = file
          const newItem = {
            ...file,
            id: file._id,
            name: this.generateApiName({
              path,
              _id,
            }),
            yapiBaseInfo: {
              ...file
            }
          }
          return customizeFilter ? customizeFilter(newItem, { currentGitBranch: branchName }) : true
        })
        const newList = await Promise.all(listCustomizeFilter.map(async (apiItem) => {
          const name = this.generateApiName({
            path: apiItem.path,
            _id: apiItem._id,
          })
          const reqInterfaceName = `IReq${name}`
          const resInterfaceName = `IRes${name}`
          let requestInterface = await this.generateRequestDataType(apiItem, reqInterfaceName)
          let responseInterface = await this.generateResponseDataType({
            interfaceInfo: apiItem,
            typeName: resInterfaceName,
            dataKey: this.config.projectId,
          })

          // 输出class 便于使用类型
          // requestInterface = requestInterface.replace('export interface', 'export class')
          if (apiItem.method.toLocaleUpperCase() === 'GET') {
            // get 类型 无法区分参数是number string
            requestInterface = requestInterface.replace(/\sstring;/g, ' string | number;')
          }

          // responseInterface = responseInterface.replace('export interface', 'export class')

          return {
            reqInterfaceName,
            requestInterface,
            resInterfaceName,
            responseInterface,
            ...apiItem,
          }
        }))
        return {
          ...rest,
          list: newList,
        }
      }))

      const arr: Types.IOutPut[] = []
      filesDesc.forEach(files => {
        files.list.forEach(file => {
          const { path, _id } = file
          const name = this.generateApiName({
            path,
            _id,
          })
          // pascalCase
          const item = {
            id: file._id,
            catid: file.catid,
            path: file.path,
            name,
            method: file.method,
            title: file.title,
            markdown: file.markdown || '',
            reqInterfaceName: file.reqInterfaceName,
            resInterfaceName: file.resInterfaceName,
            requestInterface: file.requestInterface,
            responseInterface: file.responseInterface,
            yapiBaseInfo: {
              ...file,
            },
          }
          arr.push(item)
        })
      })
      return arr
    } catch (e) {
      consola.error(`遇到错误，流程已中断`)
      process.exit(0)
    }
  }

  /**
   * 比对文件 确定文件状态
   */
  compareApiFile(files: string[], name: string, data: string) {
    // TODO: data 空格处理
    const matched = files.filter(file => file.replace(`.${this.config.target}`, '') === name)
    if (matched.length > 0) {
      // 已存在该文件
      const realPath = `${this.config.outputFilePath}/${name}.${this.config.target}`
      const oldData = fs.readFileSync(realPath, 'utf-8').toString()
      const data1 = prettier.format(data, {
        parser: this.config.target === 'ts' ? 'typescript' : 'babel',
        singleQuote: true,
        semi: false,
        tabWidth: 4
      })
      if (oldData !== data1) {
        // 修改已存在文件
        const diffResult = this.getfileDiff(oldData, data1)
        if (<string>diffResult) {
          this.modifiedFiles[name] = diffResult
        }
        // this.modifiedFiles.push(`${name}.${this.config.target}`)
        writeFileSync(
          resolveApp(`${this.config.outputFilePath}/${name}.${this.config.target}`),
          data1,
        )
      } else {
        // this.unModifiedFiles.push(`${name}.${this.config.target}`)
      }
    } else {
      // 不存在 新增
      const diffResult = this.getfileDiff('', data)
      this.addedFiles[name] = diffResult
      writeFileSync(
        resolveApp(`${this.config.outputFilePath}/${name}.${this.config.target}`),
        prettier.format(data, {
          parser: this.config.target === 'ts' ? 'typescript' : 'babel',
        }),
      )
      // this.addedFiles.push(`${name}.${this.config.target}`)
    }
  }

  // 文件新旧内容 diff
  getfileDiff(oldStr: string, str: string): string {
    return gitDiff(oldStr, str, {
      color: false,
      save: true,
      wordDiff: false,
      flags: '--ignore-all-space',
    })
  }

  getDeletedFiles(files: string[], outputs: string[]) {
    // files里存在 outputs不存在 则为即将删除的文件
    files.forEach(file => {
      if (outputs.indexOf(file) === -1 && this.ignoreFiles.indexOf(file) === -1) {
        // this.deletedFiles.push(file)
        // const diffResult = this.getfileDiff('', data)
        // 删除的文件不需要文件内容的记录
        this.deletedFiles[file] = ''
        fs.unlinkSync(resolveApp(`${this.config.outputFilePath}/${file}`))
      }
    })
  }

  // 深度比较 不包含 time字段
  deepCompareWithoutTime(data: object, nextData: object): any {
    function changes(data: any, nextData: any) {
      return _.transform(data, function (result: any, value, key) {
        if (!_.isEqual(value, nextData[key])) {
          result[key] = (_.isObject(value) && _.isObject(nextData[key])) ? changes(value, nextData[key]) : value
        }
      })
    }

    return changes(data, nextData)
  }

  // 生成日志文件
  writeLog() {
    const { deletedFiles, modifiedFiles, addedFiles } = this
    const fileName = resolveApp(`${this.config.outputFilePath}/update.json`)
    const apiUpdateItemJson: Types.IUpdateJsonItem = {
      time: new Date(),
      modifiedFiles,
      addedFiles,
      deletedFiles,
    }

    const isExists = fs.existsSync(fileName)
    let data: Types.IUpdateJsonItem[] = []
    if (isExists) {
      data = JSON.parse(fs.readFileSync(fileName).toString())
      data.push(apiUpdateItemJson)
      // 深度比较 去重
      for (let i = 0; i < data.length; i++) {
        // 与下一个比较
        if (i < data.length - 1) {
          const result = this.deepCompareWithoutTime(data[i], data[i + 1])
          // diff 比对只有time字段出现差异 视为两个相同的更新
          // 删除本项
          if (Object.keys(result).length === 1 && result.time) {
            console.log(result)
            data.splice(i, 1)
            i--
          }
        }
      }
    } else {
      // 第一次生成文件 写入数组格式
      data = [apiUpdateItemJson]
    }
    fs.writeFileSync(fileName, JSON.stringify(data))
  }

  write(outputsBase: Types.IOutPut[], callback?: (isNew: boolean) => void) {
    // 生成api文件夹
    // catid 过滤
    try {
      const outputs = outputsBase.filter(ele => {
        // if (this.config.customizeFilter) {
        //   return this.config.customizeFilter(ele, branchName)
        // }
        return true
        // if (this.config.catid && this.config.catid.exclude) {
        //   // 不期望的 catid 分类
        //   return this.config.catid.exclude.indexOf(String(ele.catid)) === -1
        // } else if (this.config.catid && this.config.catid.include) {
        //   // 只生成 catid 分类
        //   return this.config.catid.include.indexOf(String(ele.catid)) > -1
        // } else {
        //   return true
        // }
      })
      mkdirs(this.config.outputFilePath, () => {
      const files = fs.readdirSync(resolveApp(this.config.outputFilePath))
      // files里存在 outputs不存在 则为即将删除的文件
      // 1.1.0 采用不删除接口文件策略 由于删除是个低频且高风险操作
      // this.getDeletedFiles(files, outputs.map(output => `${output.name}.${this.config.target}`))
      if (outputs.length === 0) {
        consola.info(`😄 project: ${this.config.projectId} 运行结束，没有匹配接口`)
        return
      }
      outputs.forEach((api, i) => {
        const data = this.generateApiFileCode(api)
        this.compareApiFile(files, api.name, data)

        if (i === outputs.length - 1) {
          const { deletedFiles, modifiedFiles, addedFiles } = this
          const deleteds = Object.keys(deletedFiles)
          const modifieds = Object.keys(modifiedFiles)
          const addeds = Object.keys(addedFiles)
          if (modifieds.length === 0 && addeds.length === 0 && deleteds.length === 0) {
            consola.success('无接口文件更新')
            return callback && callback(false)
          }
          if (addeds.length > 0) {
            consola.log('---------------------------------------------------')
            consola.success(`😎 新增接口：${addeds.length} 个, 如下:`)
            addeds.forEach(added => {
              consola.info(added)
            })
          }

          if (modifieds.length > 0) {
            consola.log('---------------------------------------------------')
            consola.warn(`❗ 更新接口：${modifieds.length} 个, 如下:`)
            modifieds.forEach(added => {
              consola.info(added)
            })
          }

          if (deleteds.length > 0) {
            consola.log('---------------------------------------------------')
            consola.warn(`🚫 删除接口：${deleteds.length} 个, 如下:`)
            deleteds.forEach(added => {
              consola.info(added)
            })
          }
          consola.warn(`project: ${this.config.projectId}, 共计更新了${addeds.length + deleteds.length + modifieds.length}个接口文件，请到git工作区比对文件更新`)
          consola.log('===================================================')

          // generateIndexFile 控制 index 入口
          if (this.config.generateIndexFile) {
            const AllApi: string[] = outputs.map(output => output.name)
            const indexData = this.generateIndexCode(AllApi)
            mkdirs(this.config.outputFilePath, () => {
              writeFileSync(
                resolveApp(`${this.config.outputFilePath}/index.${this.config.target}`),
                indexData,
              )
            })
          }
          // generateUpdateJson 控制 updateJson
          this.config.generateUpdateJson && this.writeLog()
          return callback && callback(true)
        }
      })
    })
    } catch (e) {
      console.log('write 方法执行 错误')
      console.error(e)
    }
  }

  generateApiFileCode(api: Types.IOutPut): string {
    if (this.config.generateApiFileCode) {
      return this.config.generateApiFileCode(api)
    }
    const data = [
      `
/**
* ${api.title}
* ${api.markdown || ''}
**/
      `,
      api.requestInterface,
      api.responseInterface,
      `
export default (data: IReq) => request({
method: '${api.method}',
url: '${api.path}',
data: data
})
      `,
    ]
    return data.join(`
    `)
  }

  generateIndexCode(apis: string[]): string {
    const arr = apis.map(api => (`import ${api} from './${api}'`))
    const importStr = arr.join(`
    `)
    const exportStr = `
export default {
  ${apis.join(`,
  `)}
}
    `

    return `
${importStr}

${exportStr}
    `
  }

  /** 生成api name规则 */
  generateApiName({
    path,
    _id,
  }: {
    path: string,
    _id: string | number,
  }): string {
    if (this.config.generateApiName) {
      return this.config.generateApiName(path, _id)
    }
    const reg = new RegExp('/', 'g')
    let name = path.replace(reg, ' ').trim()
    name = changeCase.pascalCase(name.trim())
    name += _id
    return name
  }
}
