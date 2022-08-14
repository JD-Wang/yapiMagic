export const configTemplate = `
import { ServerConfig } from 'ywapi2ts'

const config: ServerConfig = {
  target: 'ts',
  serverUrl: 'http://yapi.ywwl.org',
  outputFilePath: 'api',
  projectId: '24',
  _yapi_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjE4LCJpYXQiOjE1NTY1MDYyMTUsImV4cCI6MTU1NzExMTAxNX0.ADmz2HEE6hKoe1DP_U2QtyKSSEURLf5soGKRNyJkX_o',
  _yapi_uid: '18',
  generateApiFileCode: (api) => {
    const arr = [
      \`
      /**
      * \${api.title}
      * \${api.markdown || ''}
      **/
      \`,
      "import request from './../request'",
      'type Serve<T, G> = (data?: T) => Promise<G>',
      api.requestInterface,
      api.responseInterface,
      \`
      export default (data?): Serve<
        \${api.reqInterfaceName},
        \${api.resInterfaceName}['data']
      > => request({
        method: '\${api.method}',
        url: '\${api.path}',
        data: \${(() => {
          if (api.method.toLocaleLowerCase() === 'get') {
            return '{params: data}'
          } else {
            return 'data'
          }
        })()}
      })
      \`,
    ]
    return arr.join(\`
    \`)
  }
}

export default config
`

export const viewHtmlTemplate = (updateJson: string) => `

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/element-ui/2.12.0/theme-chalk/index.css">
<style>
  body {
    padding: 0 50px 50px;
  }
  .custom-tooltip {
    width: 100% !important;
    height: 10% !important;
    position: absolute;
    top: 0px;
    left: 0px;
  }

  .custom-tooltip-item {
    width: 350px;
    height: 50px;
    position: relative;
    float: left;
    margin-left: 20px;
    border-left-style: solid;
    border-left-width: 5px
  }

  .custom-tooltip-item:first-child {
    margin-left: 0
  }

  .custom-tooltip-item-name {
    width: 80%;
    height: 20px;
    position: absolute;
    top: 0px;
    left: 10px;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px
  }

  .custom-tooltip-item-value {
    width: 80%;
    height: 30px;
    position: absolute;
    bottom: 0px;
    left: 10px;
    color: #262626;
    font-size: 18px;
    /*font-weight: bold*/
  }
  #myChart {
    width: 100%;
    margin: 20px auto;
    padding-top: 20px;
    border-top: 1px dashed #ddd;
  }
  .table-wrap {
    padding-top: 20px;
    border-top: 1px dashed #ddd;
  }
  .color1 {
    color: #E6A23C;
  }
  .color2 {
    color: #67C23A;
  }
  .color3 {
    color: #F56C6C;
  }
  .color4 {
    color: #909399;
  }
  .el-tooltip__popper {
    max-height: 500px;
    overflow-y: auto;
  }
</style>
<body>
  <script src="https://gw.alipayobjects.com/os/antv/pkg/_antv.g2-3.5.1/dist/g2.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.10/vue.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/element-ui/2.12.0/index.js"></script>
  <div id="app">
    <h2>API接口变更统计</h2>
    <el-row>
      <el-col :span="24">
        <div>
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            :picker-options="pickerOptions2"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="['00:00:00', '23:59:59']"
            @change="getDate"
            align="right">
          </el-date-picker>
        </div>
        <div id="myChart"></div>
        <div class="table-wrap">
          <el-table
            stripe
            :data="tableData"
            style="width: 100%">
            <el-table-column
              prop="time"
              label="日期"
              sortable>
            </el-table-column>
            <el-table-column
              label="API变更">
              <template slot-scope="scope">
                <div class="color1">
                  <div
                    v-if="scope.row.modifiedFiles.length"
                    v-for="(item, index) in scope.row.modifiedFiles"
                    :key="index">
                    <el-tooltip
                      effect="dark"
                      placement="top">
                      <div slot="content" v-html="item.value"></div>
                      <div>{{item.name}}</div>
                    </el-tooltip>
                  </div>
                  <div v-else>--</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="API新增">
              <template slot-scope="scope">
                <div class="color2">
                  <div
                    v-if="scope.row.addedFiles"
                    v-for="(item, index) in scope.row.addedFiles" :key="index">
                    <el-tooltip
                      effect="dark"
                      placement="top">
                      <div slot="content" v-html="item.value"></div>
                      <div>{{item.name}}</div>
                    </el-tooltip>
                  </div>
                  <div v-else>--</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="API删除">
              <template slot-scope="scope">
                <div class="color3">
                  <div
                    v-if="scope.row.deletedFiles"
                    v-for="(item, index) in scope.row.deletedFiles" :key="index">{{item.name}}</div>
                  <div v-else>--</div>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</body>
</html>
<script>
  let baseData = ${updateJson}
  const times = new Date().getTime() + 24 * 60 * 60 * 1000

  new Vue({
    el: '#app',
    data: function() {
      return {
        dataArr: [],
        copyData: [],
        timeRange: '',
        pickerOptions2: {
          shortcuts: [{
            text: '最近一周',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit('pick', [start, end]);
            }
          }, {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit('pick', [start, end]);
            }
          }],
          disabledDate(time) {
            return time.getTime() >= times
          }
        },
        tableData: [],
        chart: null
      }
    },
    mounted() {
      this.handleAllData(baseData)
      this.initChart(this.dataArr)
    },
    methods: {
      jsonToArr(obj) {
        let arr = []
        for (let i in obj) {
          let item = {}
          item.name = i
          obj[i] = obj[i].replace(/\\n/g, '<br>')
          item.value = obj[i]
          arr.push(item)
        }
        return arr
      },
      handleTableArr(obj) {
        let tableObj = {}
        tableObj.time = new Date(obj.time).toLocaleString()
        tableObj.modifiedFiles = this.jsonToArr(obj.modifiedFiles)
        tableObj.addedFiles = this.jsonToArr(obj.addedFiles)
        tableObj.deletedFiles = this.jsonToArr(obj.deletedFiles)
        this.tableData.push(tableObj)
        this.tableData.reverse()
      },
      // 全部数据
      handleAllData(data) {
        this.dataArr = []
        this.tableData = []
        data.forEach(item => {
          let obj = {}, obj1 = {}, obj2 = {}
          obj.date = new Date(item.time).toLocaleString()
          obj.type = 'modifiedFiles'
          obj.value = Object.keys(item.modifiedFiles).length

          obj1.date = new Date(item.time).toLocaleString()
          obj1.type = 'addedFiles'
          obj1.value = Object.keys(item.addedFiles).length

          obj2.date = new Date(item.time).toLocaleString()
          obj2.type = 'deletedFiles'
          obj2.value = Object.keys(item.deletedFiles).length

          this.dataArr.push(obj)
          this.dataArr.push(obj1)
          this.dataArr.push(obj2)

          this.handleTableArr(item)
        })
        console.log(this.tableData, 8877)
      },
      // 日期筛选数据
      handleFilterData() {
        this.copyData = []
        let startTime = new Date(this.timeRange[0]).getTime()
        let endTime = new Date(this.timeRange[1]).getTime()
        baseData.forEach(item => {
          let time = new Date(item.time).getTime()
          if (time < endTime && time > startTime) {
            this.copyData.push(item)
          }
        })
        this.handleAllData(this.copyData)
      },
      getDate() {
        if (this.timeRange) {
          this.handleFilterData()
          this.chart.destroy()
          this.initChart(this.dataArr)
        } else {
          this.handleAllData(baseData)
          this.chart.destroy()
          this.initChart(this.dataArr)
        }
      },
      initChart(data) {
        this.chart = new G2.Chart({
          container: 'myChart',
          forceFit: true,
          height: 400,
          padding: [100, 100, 50,50] // 上右下左
        })
        this.chart.source(data)
        this.chart.tooltip({
          follow: false,
          crosshairs: 'y',
          htmlContent: function htmlContent(title, items) {
            var alias = {
              modifiedFiles: 'API变更数量(日期/数量)',
              addedFiles: 'API新增数量(日期/数量)',
              deletedFiles: 'API删除数量(日期/数量)'
            }
            var html = '<div class="custom-tooltip">'
            for (var i = 0; i < items.length; i++) {
              console.log(item, 4444)
              var item = items[i];
              var color = item.color;
              var name = alias[item.name];
              var value = item.title+'/'+item.value;
              var domHead = '<div class="custom-tooltip-item" style="border-left-color:' + color + '">'
              var domName = '<div class="custom-tooltip-item-name">' + name + '</div>'
              var domValue = '<div class="custom-tooltip-item-value">' + value + '</div>'
              var domTail = '</div>'
              html += domHead + domName + domValue + domTail
            }
            return html + '</div>'
          }
        })
        this.chart.axis('date', {
          label: {
            textStyle: {
              fill: '#aaaaaa'
            }
          }
        })
        this.chart.axis('value', {
          label: {
            textStyle: {
              fill: '#aaaaaa'
            },
            formatter: function formatter(text) {
              return text.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
            }
          }
        })
        this.chart.legend(false)
        this.chart.line().position('date*value').color('type', ['#67C23A', '#E6A23C', '#F56C6C', '#909399'])
        this.chart.render()
        this.chart.showTooltip({
          x: document.getElementById("myChart").clientWidth - 20,
          y: 100
        })
      }
    }
  })
</script>`
