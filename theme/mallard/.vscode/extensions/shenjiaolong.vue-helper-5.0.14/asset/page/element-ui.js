const fs = require('fs')
const path = require('path')
const os = require('os')

/**
{
  name: '页面名称',
  path: '选中放置目录',
  api: {
    add: '新增',
    detail: '单行详情',
    batchDelete: '批量删除',
    delete: '删除',
    edit: '编辑',
    export: '导出',
    import: '导入',
    list: '列表'
  }
  fields: [{
    dataType: 'string', // string number select boolean date dateRange time 
    key: 'key', // key
    name: 'name', // 名称
    query: false, // 是否做为查询条件
    show: false, // 是否显示
    sort: false, // 排序
    width: '200px' // 宽度
  }]
}
 */
const params = JSON.parse(process.argv[2])
const primaryKey = params.fields[0].key // 主键，类似id
const primaryType = params.fields[0].dataType === 'number' ? 'number' : 'string'
// 查询项
const queryList = params.fields.filter((field) => {
  return field.query
})

function generatePageQuery() {
  let queryRet = ''
  if (queryList.length > 0) {
    queryRet = `    <el-card shadow="never" class="m-query">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="68px"
      >\n`
    queryList.forEach(query => {
      queryRet += `        <el-form-item label="${query.name}" prop="${query.key}">\n`
      switch (query.dataType) {
        case 'string':
          queryRet += `          <el-input v-model="queryParams.${query.key}" placeholder="请输入${query.name}" clearable @keyup.enter="handleQuery" />\n`
          break;
        case 'number':
          queryRet += `          <el-input type="number" v-model="queryParams.${query.key}" placeholder="请输入${query.name}" clearable @keyup.enter="handleQuery" />\n`
          break;
        case 'select':
        case 'boolean':
          queryRet += `          <el-select v-model="queryParams.${query.key}" placeholder="请选择" filterable clearable>
              <el-option :label="${query.key}Item.label" :value="${query.key}Item.value" v-for="${query.key}Item in ${query.key}List" :key="${query.key}Item.label" />
          </el-select>\n`

          break;
        case 'date':
          queryRet += `          <el-date-picker v-model="queryParams.${query.key}" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" />\n`
            break;
        case 'dateRange':
          queryRet += `          <el-date-picker v-model="queryParams.${query.key}" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" />\n`
            break;
        case 'time':
          queryRet += `          <el-date-picker v-model="queryParams.${query.key}" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" placeholder="选择日期" />\n`
            break;
        default:
          queryRet += `          <el-input v-model="queryParams.${query.key}" placeholder="请输入${query.name}" clearable @keyup.enter="handleQuery" />\n`
          break;
      }
      queryRet += '        </el-form-item>\n'
    });
    queryRet += `        <el-form-item>
          <el-button @click="handleQuery"><i class="el-icon-search"></i> 搜索</el-button>
          <el-button @click="resetQuery"><i class="el-icon-refresh"></i> 重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>\n`
  }
  return queryRet
}

function generatePageTable() {
  let tableRet = `    <el-card shadow="never">
      <div class="m-table-title">
        <el-button type="primary" plain @click="openForm('add')" >
          <i class="el-icon-plus"></i> 新增
        </el-button>\n`
  if (params.api.import) {
    tableRet += `        <el-button type="warning" plain @click="handleImport" >
          <<i class="el-icon-upload2"></i> 导入
        </el-button>\n`
  }
  if (params.api.export) {
    tableRet += `        <el-button type="success" plain @click="handleExport" :loading="exportLoading" >
          <i class="el-icon-download"></i> 导出
        </el-button>\n`
  }
  if (params.api.batchDelete) {
    tableRet += `        <el-dropdown v-if="selectedList.length > 0" @command="batchOpt">
            <el-button plain class="ml12">
                批量操作 <i class="el-icon-arrow-down"></i>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="batchDelete">
                      <i class="el-icon-delete"></i> 删除
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>\n`
  }

  tableRet += `      </div>\n`

  tableRet += `      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55"/>\n`
  
  params.fields.forEach(field => {
    if (field.show) {
      tableRet += `        <el-table-column label="${field.name}" prop="${field.key}" ${field.sort ? 'sortable' : ''} ${field.width ? 'width="' + field.width + '"' : ''} :show-overflow-tooltip="true"></el-table-column>\n`
    }
  });

  tableRet += `        <el-table-column label="操作" align="center" width="160">
          <template #default="scope">\n`
  if (params.api.edit) {
    tableRet += `            <el-button type="primary" link @click="openForm('update', scope.row.id)" >
              <i class="el-icon-edit"></i> 修改
            </el-button>\n`
  }
  if (params.api.delete) {
    tableRet += `            <el-popconfirm title="确定删除?" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(scope.row.id)">
                <template #reference>
                  <el-button type="danger" link >
                    <i class="el-icon-delete"></i> 删除
                  </el-button>
                </template>
            </el-popconfirm>\n`
  }

  tableRet += `          </template>
        </el-table-column>
      </el-table>
      <div class="m-pagination">
        <el-pagination 
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange" 
          :current-page="queryParams.pageNum" 
          :page-sizes="[10, 20, 50]" 
          :page-size="queryParams.pageSize" 
          layout="total, sizes, prev, pager, next, jumper" 
          :total="total">
        </el-pagination>
      </div>\n`

  tableRet += `    </el-card>\n`
  return tableRet
}

function generatePageScript() {
  let ret = `<script>
import { getList, exportXls, deleteById, batchDeleteByIds } from './${params.name}Api.js'
import ${params.name}Au from './${params.name}Au.vue'\n`

if (params.api.import) {
  ret += `import ${params.name}Import from './${params.name}Import.vue'\n`
}

ret += '\n'

ret += `export default {
  components: {
    ${params.name}Au,\n`

if (params.api.import) {
  ret += `    ${params.name}Import\n`
}

ret += `  },
  data() {
    return {
      loading: true,
      total: 0,
      list: [],
      selectedList: [],
      importRef: '',
      exportLoading: false,
      queryParams: {
        pageNo: 1,
        pageSize: 10,\n`

params.fields.forEach(field => {
  if (field.query) {
    switch (field.dataType) {
      case 'string':
        ret += `        ${field.key}: '',\n`
        break;
      case 'number':
        ret += `        ${field.key}: 0,\n`
        break;
      case 'select':
        ret += `        ${field.key}: undefined,\n`
        break;
      case 'boolean':
        ret += `        ${field.key}: false,\n`
        break;
      case 'date':
        ret += `        ${field.key}: '',\n`
        break;
      case 'dateRange':
        ret += `        ${field.key}: ['', ''],\n`
        break;
      case 'time':
        ret += `        ${field.key}: '',\n`
        break;
      default:
        ret += `        ${field.key}: '',\n`
        break;
    }
  }
});

ret += `      },\n`

params.fields.forEach(field => {
  if (field.dataType === 'select' && field.query) {
    ret += `      ${field.key}List: [],\n`
  }
})

params.fields.forEach(field => {
  if (field.dataType === 'boolean' && field.query) {
    ret += `      ${field.key}List: [{
        label: '是',
        value: true
      }, {
        label: '否',
        value: false
      }],\n`
  }
})

ret += `    }
  },\n`


ret += `  mounted() {
    this.queryList()
  },
  methods: {
    handleCurrentChange(val) {
      this.queryParams.pageNum = val
      this.queryList()
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.queryList()
    },
    async queryList() {
      this.loading = true
      try {
        const data = await getList(this.queryParams)
        this.list = data.data.list
        this.total = data.data.total
      } finally {
        this.loading = false
      }
    },
    handleQuery() {
      this.queryParams.pageNo = 1
      this.queryList()
    },
    resetQuery() {
      this.$refs.queryFormRef.resetFields()
      this.handleQuery()
    },
    openForm(type, ${primaryKey}) {
      this.$refs.formRef.open(type, ${primaryKey})
    },
    handleImport() {
      this.$refs.importRef.open()
    },
    handleExport() {
      this.$confirm('是否确认导出数据项？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.exportLoading = true
        exportXls(this.queryParams).then((data) => {
          // download.excel(data, 'page.xls')
          // 创建 blob
          const blob = new Blob([data.data], { type: 'application/vnd.ms-excel' })
          // 创建 href 超链接，点击进行下载
          window.URL = window.URL || window.webkitURL
          const href = URL.createObjectURL(blob)
          const downA = document.createElement('a')
          downA.href = href
          downA.download = 'page.xls'
          downA.click()
          // 销毁超连接
          window.URL.revokeObjectURL(href)
          this.exportLoading = false
        })
      }).catch(() => {
        this.exportLoading = false
      })
    },
    async handleDelete(${primaryKey}) {
      try {
        // 发起删除
        await deleteById(${primaryKey})
        this.$message.success('删除成功')
        // 刷新列表
        await this.queryList()
      } catch {}
    },
    handleSelectionChange(select) {
      this.selectedList = select
    },
    async batchDelete(${primaryKey}s) {
      await batchDeleteByIds(${primaryKey}s)
      this.$message.success('批量删除成功')
    },
    batchOpt(cmd) {
      switch (cmd) {
        case 'batchDelete':
          const ${primaryKey}s = this.selectedList.map((select) => {
            return select.${primaryKey}
          })
          this.batchDelete(${primaryKey}s)
          break
        default:
          break
      }
    }
  }
}

</script>
<style lang="scss" scoped>
.m-query {
  margin-bottom: 20px;
  .el-select {
    min-width: 100px;
  }
}
.ml12 {
  margin-left: 12px;
}
.m-pagination {
  text-align: right;
  padding-top: 10px;
}
</style>`

return ret
}

function generatePage() {
  let ret = `<template>
  <div class="m-page">\n`
  // 查询条件
  ret += generatePageQuery()

  ret += '\n'

  ret += generatePageTable()
  
  ret += `    <${params.name}Au ref="formRef" @success="queryList" />\n`
  if (params.api.import) {
    ret += `    <${params.name}Import ref="importRef" @success="queryList" />\n`
  }

  ret += `  </div>\n`
  ret += `</template>\n`

  ret += generatePageScript()

  fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + '.vue'), ret, 'utf-8')
}

function generateApi() {
  let ret = `import axios from 'axios'
// 后端地址
axios.defaults.baseURL = ''\n\n`

  ret += `// 查询列表
export async function getList(data) {
  return axios.post('${params.api.list || ''}', {
    data
  })
}
\n`

  ret += `// 查询详情
export const getDetail = (${primaryKey}) => {
  return axios.get('${params.api.detail || ''}?${primaryKey}=' + ${primaryKey})
}
\n`


  ret += `// 新增
export const postAdd = (data) => {
  return axios.post('${params.api.add || ''}', {
    data
  })
}
\n`

ret += `// 修改
export const putUpdate = (data) => {
  return axios.put('${params.api.edit || ''}', {
    data
  })
}
\n`

ret += `// 删除
export const deleteById = (${primaryKey}) => {
  return axios.delete('${params.api.delete || ''}?${primaryKey}=' + ${primaryKey})
}
\n`

  if (params.api.batchDelete) {
    ret += `// 批量删除
export const batchDeleteByIds = (${primaryKey}s) => {
  return axios.delete('${params.api.batchDelete || ''}?${primaryKey}s=' + ${primaryKey}s.join(','))
}
\n`
  }

  if (params.api.export) {
    ret += `// 导出
export const exportXls = (params) => {
  return axios.get('${params.api.export}', {
    params,
    responseType: 'blob'
  })
}
\n`
  }

  if (params.api.import) {
    ret += `// 下载模板
export const downloadTemplate = () => {
  return axios.get('${params.api.download || ''}', {
    responseType: 'blob'
  })
}
\n`
  }

fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + 'Api.js'), ret, 'utf-8')
}

function generateAu() {
  let ret = `<template>
  <el-dialog :visible.sync="dialogVisible" :title="dialogTitle" width="600px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-row>\n`
  params.fields.forEach(field => {
    switch (field.dataType) {
      case 'string':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-input v-model="formData.${field.key}" placeholder="请输入${field.name}" />
          </el-form-item>
        </el-col>\n`
        break;
      case 'number':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-input type="number" v-model="formData.${field.key}" placeholder="请输入${field.name}" />
          </el-form-item>
        </el-col>\n`
        break;
      case 'select':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-select v-model="formData.${field.key}" placeholder="请选择${field.name}" filterable clearable>
                <el-option :label="${field.key}Item.label" :value="${field.key}Item.value" v-for="${field.key}Item in ${field.key}List" :key="${field.key}Item.value" />
            </el-select>
          </el-form-item>
        </el-col>\n`
        break;
      case 'boolean':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-switch v-model="formData.${field.key}" />
          </el-form-item>
        </el-col>\n`
        break;
      case 'date':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-date-picker v-model="formData.${field.key}" value-format="YYYY-MM-DD" type="date" placeholder="选择日期" />
          </el-form-item>
        </el-col>\n`
        break;
      case 'dateRange':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-date-picker v-model="formData.${field.key}" value-format="YYYY-MM-DD" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" />
          </el-form-item>
        </el-col>\n`
        break;
      case 'time':
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-date-picker v-model="formData.${field.key}" value-format="YYYY-MM-DD HH:mm:ss" type="datetime" placeholder="选择日期" />
          </el-form-item>
        </el-col>\n`
        break;
      default:
        ret += `        <el-col :span="12">
          <el-form-item label="${field.name}" prop="${field.key}">
            <el-input v-model="formData.${field.key}" placeholder="请输入${field.name}" />
          </el-form-item>
        </el-col>\n`
        break;
    }
  });

  ret += `      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
    </template>
  </el-dialog>
</template>\n`

  ret += `<script>
import { getDetail, postAdd, putUpdate } from './${params.name}Api.js'

export default {
  data() {
    return {
      dialogVisible: false,
      dialogTitle: '',
      formLoading: false,
      formType: '',
      typeKv: {
        'add': '新增',
        'update': '修改',
      },
      formData: {\n`

params.fields.forEach(field => {
  switch (field.dataType) {
    case 'string':
      ret += `        ${field.key}: '',\n`
      break;
    case 'number':
      ret += `        ${field.key}: 0,\n`
      break;
    case 'select':
      ret += `        ${field.key}: undefined,\n`
      break;
    case 'boolean':
      ret += `        ${field.key}: false,\n`
      break;
    case 'date':
      ret += `        ${field.key}: '',\n`
      break;
    case 'dateRange':
      ret += `        ${field.key}: ['', ''],\n`
      break;
    case 'time':
      ret += `        ${field.key}: '',\n`
      break;
    default:
      ret += `        ${field.key}: '',\n`
      break;
  }
})
  ret += `},
      formRules: {

      },\n`

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `      ${field.key}List: [],\n`
  }
});

ret += `    }
  },
  methods: {\n`

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `    query${field.key[0].toUpperCase() + field.key.substring(1, field.key.length)}List() {
      return []
    },\n`
  }
});

ret += `    async open(type, ${primaryKey}) {
      this.dialogVisible = true
      this.dialogTitle = this.typeKv[type]
      this.formType = type
      this.resetForm()
      // 修改时，设置数据
      if (${primaryKey}) {
        this.formLoading = true
        try {
          const data = await getDetail(${primaryKey})
          this.formData = data.data
        } finally {
          this.formLoading = false
        }
      }

      // 选项\n`

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `      this.query${field.key[0].toUpperCase() + field.key.substring(1, field.key.length)}List()\n`
  }
});

ret += `    },
    async submitForm() {
      // 校验表单
      if (!this.$refs.formRef) return
      const valid = await this.$refs.formRef.validate()
      if (!valid) return
      // 提交请求
      this.formLoading = true
      try {
        const data = this.formData
        if (this.formType === 'add') {
          await postAdd(data)
          this.$message.success('新增成功')
        } else {
          await putUpdate(data)
          this.$message.success('修改成功')
        }
        this.dialogVisible = false
        // 发送操作成功的事件
        this.$emit('success')
      } finally {
        this.formLoading = false
      }
    },
    resetForm() {
      this.formData = {\n`

params.fields.forEach(field => {
  switch (field.dataType) {
    case 'string':
      ret += `        ${field.key}: '',\n`
      break;
    case 'number':
      ret += `        ${field.key}: 0,\n`
      break;
    case 'select':
      ret += `        ${field.key}: undefined,\n`
      break;
    case 'boolean':
      ret += `        ${field.key}: false,\n`
      break;
    case 'date':
      ret += `        ${field.key}: '',\n`
      break;
    case 'dateRange':
      ret += `        ${field.key}: ['', ''],\n`
      break;
    case 'time':
      ret += `        ${field.key}: '',\n`
      break;
    default:
      ret += `        ${field.key}: '',\n`
      break;
  }
})
  
ret += `      }
      this.$nextTick(() => {
        this.$refs.formRef.resetFields()
      })
    }
  }
}

</script>
`

  fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + 'Au.vue'), ret, 'utf-8')
}

function generateImport() {
  let ret = `<template>
  <el-dialog :visible.sync="dialogVisible" title="导入" width="400px">
    <el-upload
      ref="uploadRef"
      :file-list="fileList"
      :action="importUrl + '?updateSupport=' + updateSupport"
      :auto-upload="false"
      :disabled="formLoading"
      :limit="1"
      :on-error="submitFormError"
      :on-exceed="handleExceed"
      :on-success="submitFormSuccess"
      accept=".xlsx, .xls"
      drag
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="el-upload__tip">
            <el-checkbox v-model="updateSupport" />
            是否更新已经存在的数据
          </div>
          <span>仅允许导入 xls、xlsx 格式文件。</span>
          <el-link
            :underline="false"
            style="font-size: 12px; vertical-align: baseline"
            type="primary"
            @click="importTemplate"
          >
            下载模板
          </el-link>
        </div>
      </template>
    </el-upload>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { downloadTemplate } from './${params.name}Api.js'

export default {
  data() {
    return {
      dialogVisible: false,
      formLoading: false,
      importUrl: '${params.api.import || ''}',
      fileList: [],
      updateSupport: 0,
    }
  },
  methods: {
    open() {
      this.dialogVisible = true
      this.updateSupport = 0
      this.fileList = []
      this.resetForm()
    },
    async submitForm() {
      // 提交请求
      this.formLoading = true
      this.$refs.uploadRef.submit()
    },
    submitFormSuccess(response) {
      if (response.code !== 0) {
        this.$message.error(response.msg)
        this.formLoading = false
        return
      }
      // 拼接提示语
      const data = response.data
      // let text = '上传成功数量：' + data.length + ';'
      // this.$message.success(text)
      this.formLoading = false
      this.dialogVisible = false
      // 发送操作成功的事件
      this.$emits('success')
    },
    submitFormError() {
      this.$message.error('上传失败，请您重新上传！')
      this.formLoading = false
    },
    async resetForm() {
      // 重置上传状态和文件
      this.formLoading = false
      this.$nextTick(() => {
        this.$refs.uploadRef.clearFiles()
      })
    },
    handleExceed() {
      this.$message.error('最多只能上传一个文件！')
    },
    async importTemplate() {
      const res = await downloadTemplate()
      // 创建 blob
      const blob = new Blob([res.data], { type: 'application/vnd.ms-excel' })
      // 创建 href 超链接，点击进行下载
      window.URL = window.URL || window.webkitURL
      const href = URL.createObjectURL(blob)
      const downA = document.createElement('a')
      downA.href = href
      downA.download = '${params.name}.xls'
      downA.click()
      // 销毁超连接
      window.URL.revokeObjectURL(href)
    }
  }
}
</script>
`

fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + 'Import.vue'), ret, 'utf-8')
}

// 入口函数
function generate() {
  generatePage()
  generateApi()
  generateAu()
  generateImport()
}


generate()