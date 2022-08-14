# yapiMagic

##### 一个根据yapi文档自动生成前端api接口代码的工具，提升效率

### 解决痛点
  * 后端基于yapi写出的mock 前端几乎人肉copy，加大工作量，特别在ts这种强类型项目中，需要手写所有接口的入参出参类型，耗时长
  * 对接口规范要求高，因为代码是自动生成的，所以更要注意接口文档的严谨性

## 安装

```
npm i yapiMagic -g

```

安装完成后可以检查下环境中是否有 `yapiMagic`

## 需登录yapi账号密码后使用
token并不好用，微服务架构下，跨分类、项目较多，token维护麻烦

## 使用方法

 - 2、 生成 yapiMagic.config.ts 文件配置到项目

  `yapiMagic init`
  到当前开发的项目根目录（与package.json平级）运行该命令，如果当前目录已存在`yapiMagic.config.ts` 则会提示是否覆盖，没有则会创建，具体配置说明:


  ```js
  export interface ServerConfig {
    /**
    * 构建ts 、js版本
    *
    * @example 'ts'
    */
    target: 'ts' | 'js',
    /**
    * YApi 服务地址。
    *
    * @example 'http://yapi.foo.bar'
    */
    serverUrl: string,
    /**
    * 项目id
    *
    * @example 'http://yapi.ywwl.org/project/24/interface/api' projectId 对应 24
    */
    projectId: string,
    /** cookie _yapi_token */
    _yapi_token: string,
    /** cookie _yapi_uid */
    _yapi_uid: string,
    /**
    * 是否自动开启changelog视图
    * generateUpdateJson 为 true时生效
    */
    changelog: boolean,
    /**
    * 1.1.0新增 是否生成 updateJson 文件, 默认 false
    */
    generateUpdateJson: boolean,
    /**
    * 1.1.0新增 是否生成 index 文件入口, 默认 false
    */
    generateIndexFile: boolean,
    /** api.d.ts 全局声明的命名空间 会包含所有的接口interface 默认值 YapiTypes */
    apiInterfaceNamespace?: string,
    /**
    * 输出文件路径。
    *
    * 可以是 `相对路径` 或 `绝对路径`。
    *
    * @example 'src/api/index.ts'
    */
    outputFilePath: string,
    /**
    * 1.1.0 被废除， 请使用customizeFilter
    * include 只包含的 catid
    * exclude 忽略的 catid
    * include exclude 只配置其中之一 也可以都不配置（*）
    */
    catid?: {
      exclude?: string[],
      include?: string[],
    },
    /**
    * 过滤需要比对的文件方法
    * currentGitBranch 当前git分支号
    */
    customizeFilter?: (api: IOutPut, opt: {
      currentGitBranch: string,
    }) => boolean,
    /**
    * 文件名称生成规则
    * @param  {string} path 接口路径 url
    * @param  {string} _id 接口id
    * @param  {string} projectId 项目id
    */
    generateApiName?: (path: string, _id: string | number) => string,
    /**
    * 自定义代码片段函数
    * 不配置的话会有默认代码片段
    */
    generateApiFileCode?: (api: IOutPut) => string,
    /**
    * 更新文件方式
    * 1.1.0 废弃，请使用customizeFilter 自定义
    */
    updateMode: ('ADD' | 'DELETE' | 'CHANGE')[]
  }
  // generateApiFileCode 方法中 api字段说明
  export interface IOutPut {
    /** 生成api 文件名称 */
    name: string,
    /** 接口url */
    path: string,
    method: Method,
    /** 接口名 */
    title: string,
    /** 接口备注 */
    markdown: string,
    /** 分类菜单id */
    catid: number,
    /** 接口ID */
    id: number,
    /** request interface 名称 */
    reqInterfaceName: string,
    /** response interface 名称 */
    resInterfaceName: string,
    requestInterface: string,
    responseInterface: string,
    /**
    * yapi 基础数据源，包含yapi该项接口所有源数据
    */
    yapiBaseInfo: Object,
  }

```


  1.示例
   * ts版本


```typescript

const config = {
  target: 'ts',
  serverUrl: 'https://yapi.xxxxxx.com',
  outputFilePath: 'src/api',
  projectId: '48',
  // 不生成 updateJson
  generateUpdateJson: false,
  // 不生成 index文件
  generateIndexFile: false,
  generateApiFileCode: (api) => {
    const arr = [
      `
      /**
      * ${api.title}
      * ${api.markdown || ''}
      **/
      `,
      "import request from '../utils/request'",
      'type Serve<T, G> = (data?: T) => Promise<G>',
      api.requestInterface,
      api.responseInterface,
      `const http: Serve<${api.reqInterfaceName}, ${api.resInterfaceName}['data'] > = (data?) =>  request({
        method: '${api.method}',
        url: '${api.path}',
        data: ${(() => {
          if (api.method.toLocaleLowerCase() === 'get') {
            return 'params: data'
          } else {
            return 'data'
          }
        })()}
      }) `,
      `export default http`,
    ]
    return arr.join(`
    `)
  }
}

module.exports = config


```

  * js版本

```js
const config = {
  target: 'js',
  serverUrl: 'https://yapi.xxxxxx.com',
  outputFilePath: 'src/api',
  projectId: '48',
  // 不生成 updateJson
  generateUpdateJson: false,
  // 不生成 index文件
  generateIndexFile: false,
  customizeFilter: (api, branchName) => {
    // 采用 git 分支号做多版本并行的标识
    // 你也可以自定义 你需要的规则来判断你需要生成的接口
    const { tag } = api.yapiBaseInfo
    if (tag.includes(branchName)) {
      console.log(api.id)
    }
    return tag.includes(branchName)
  },
  generateApiFileCode: (api) => {
    const arr = [
      `
      /**
      * ${api.title}
      * ${api.markdown || ''}
      **/
      `,
      "import request from '@/utils/request.js'",

      `export default (data = {}) => request({
        method: '${api.method}',
        url: '${api.path}',
        ${(() => {
          if (api.method.toLocaleLowerCase() === 'get') {
            return 'params: data,'
          } else {
            return 'data'
          }
        })()}
      })`,
    ]
    return arr.join(`
    `)
  }
}

module.exports = config


```


  一般来说 generateApiFileCode 方法需要自己实现一下，组装拼接出符合自己期望的 接口代码格式

 - 3、生成代码
  `yapiMagic`
  运行该命令 会根据步骤2的配置文件，生产出api（outputFilePath）文件夹，该文件夹下`index.ts`作为所有接口的导出口，供项目中导入使用

  * config 可以是数组形式(1.0.7之后版本支持)，生成多个project的yapi接口到你的项目，值得注意的是，每一个项目都应该是独有的`outputPath`，模板片段也不应该设置相同（访问不同域名）

 - 4、查看接口变动日志`yapiMagic changelog`

 - 5、查看版本号 `yapiMagic version`

