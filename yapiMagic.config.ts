import { Interface, IOutPut, ServerConfig } from 'yapiMagic'
import consola from 'consola'

const serverUrl = 'https://yapi.xxxxxx.com'
if (serverUrl === 'https://yapi.xxxxxx.com') {
  consola.warn('请先配置yapi地址，更换serverUrl')
  process.exit(0)
}

const generateApiFileCode = (projectId: string) => (api: Interface & IOutPut) => {
  const dataReq = `
    export type IReq${api.id} = Omit<${api.reqInterfaceName}, 'shopId'>`
  const arr = [
    `
    /* eslint-disable */
    // @ts-nocheck
    /**
      * ${api.title}
      * ${serverUrl}/project/${projectId}/interface/api/${api.id}
    **/

    // import api${api.id} from '@/apis/${projectId}/api${api.id}'
   // @ts-ignore
      import request from '@/utils/http.ts'

`,
    api.requestInterface,
    api.responseInterface,
    dataReq,
  ]
  // @ts-ignore
  const { yapiBaseInfo: { req_headers } } = api
  const reqHeaders = req_headers.find((item) => item.name.trim() === 'service-name')
  const serverName = reqHeaders && reqHeaders.value ? reqHeaders.value : api.path.split('/')[2]

  // const serverName = api.reqHeaders && api.reqHeaders.value ? api.reqHeaders.value : api.path.split('/')[2]

  const isRestful = api.path.includes('{')
  if (isRestful) {
    const reg = /\{.*?\}/g

    // @ts-ignore
    const paramsKeys = api.path.match(reg).map((ele) => ele.replace('{', '').replace('}', ''))
    const paramsKeysStr = paramsKeys.reduce((prev, value) => {
      prev += `${value},`
      return prev
    }, '')

    arr.push(`
      export default (${paramsKeysStr} data?: IReq${api.id}, config?: boolean | { showMsg?: Boolean, needCatch?: Boolean }): Promise<${api.resInterfaceName}> => request({
        method: '${api.method}',
        url: '${api.path.replace(/\{/, '\'+').replace(/\}/, '')},
        yapi:'${projectId}',
        config: {
          headers: {
            'service-name': '${serverName}'
          }
        },
        data,
        ...typeof config === 'boolean' ? { showMsg: config } : config
      })
    `)
  } else {
    arr.push(`
      export default (data?: IReq${api.id}, config?: boolean | { showMsg?: Boolean, needCatch?: Boolean }): Promise<${api.resInterfaceName}> => request({
        method: '${api.method}',
        url: '${api.path}',
        yapi:'${projectId}',
        config: {
          headers: {
            'service-name': '${serverName}'
          }
        },
        data,
        ...typeof config === 'boolean' ? { showMsg: config } : config
      })
    `)
  }

  return arr.join('')
}

const genProject = (projectId: string): ServerConfig => {
  return {
    changelog: false,
    generateUpdateJson: false,
    target: 'ts',
    notCheckGit: true,
    serverUrl,
    outputFilePath: `src/apis`,
    generateIndexFile: false,
    projectId,
    generateApiName: (_path, _id) => {
      return `api${_id}`
    },
    customizeFilter: (api, { currentGitBranch }) => {
      // @ts-ignore
      const { yapiBaseInfo: { tag } } = api
      // return (tag || []).includes(currentGitBranch)
      return true
    },
    // @ts-ignore
    generateApiFileCode: generateApiFileCode(projectId),
  }
}

const configs = [
  genProject('294')
]

module.exports = configs
