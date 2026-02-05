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
        :model="queryParams"
        ref="queryFormRef"
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
          <el-button @click="handleQuery"> <el-icon><Search/></el-icon> 搜索</el-button>
          <el-button @click="resetQuery"> <el-icon><Search/></el-icon> 重置</el-button>
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
          <el-icon><Plus/></el-icon> 新增
        </el-button>\n`
  if (params.api.import) {
    tableRet += `        <el-button type="warning" plain @click="handleImport" >
          <el-icon><Upload/></el-icon> 导入
        </el-button>\n`
  }
  if (params.api.export) {
    tableRet += `        <el-button type="success" plain @click="handleExport" :loading="exportLoading" >
          <el-icon><Download/></el-icon> 导出
        </el-button>\n`
  }
  if (params.api.batchDelete) {
    tableRet += `        <el-dropdown v-if="selectedList.length > 0" @command="batchOpt">
            <el-button plain class="ml12">
                批量操作 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="batchDelete">
                      <el-icon><Delete /></el-icon> 删除
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
              <el-icon><Edit/></el-icon> 修改
            </el-button>\n`
  }
  if (params.api.delete) {
    tableRet += `            <el-popconfirm title="确定删除?" confirm-button-text="确定" cancel-button-text="取消" @confirm="handleDelete(scope.row.id)">
                <template #reference>
                  <el-button type="danger" link >
                    <el-icon><Delete/></el-icon> 删除
                  </el-button>
                </template>
            </el-popconfirm>\n`
  }

  tableRet += `          </template>
        </el-table-column>
      </el-table>
      <div class="m-pagination">
        <div class="flex-1"></div>
        <el-pagination
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange" 
          :current-page="queryParams.pageNo" 
          :page-sizes="[10, 20, 50]" 
          :page-size="queryParams.pageSize" 
          layout="total, sizes, prev, pager, next, jumper" 
          :total="total"/>
      </div>\n`

  tableRet += `    </el-card>\n`
  return tableRet
}

function generatePageScript() {
  let ret = `<script lang="ts" setup>
import { getList, exportXls, deleteById, batchDeleteByIds } from './${params.name}Api'
import { ArrowDown, Delete, Edit, Plus, Upload, Download, Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ${params.name}Au from './${params.name}Au.vue'\n`

if (params.api.import) {
  ret += `import ${params.name}Import from './${params.name}Import.vue'\n`
}

ret += '\n'

ret += `const loading = ref(true)
const total = ref(0)
const list = ref([] as any[])
const selectedList = ref([] as any[])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,\n`

params.fields.forEach(field => {
  if (field.query) {
    switch (field.dataType) {
      case 'string':
        ret += `  ${field.key}: '',\n`
        break;
      case 'number':
        ret += `  ${field.key}: 0,\n`
        break;
      case 'select':
        ret += `  ${field.key}: undefined,\n`
        break;
      case 'boolean':
        ret += `  ${field.key}: false,\n`
        break;
      case 'date':
        ret += `  ${field.key}: '',\n`
        break;
      case 'dateRange':
        ret += `  ${field.key}: ['', ''],\n`
        break;
      case 'time':
        ret += `  ${field.key}: '',\n`
        break;
      default:
        ret += `  ${field.key}: '',\n`
        break;
    }
  }
});

ret += `})
const queryFormRef = ref()\n`

params.fields.forEach(field => {
  if (field.dataType === 'select' && field.query) {
    ret += `const ${field.key}List = ref([] as any[])\n`
  }
})

params.fields.forEach(field => {
  if (field.dataType === 'boolean' && field.query) {
    ret += `const ${field.key}List = ref([{
      label: '是',
      value: true
    }, {
      label: '否',
      value: false
    }])\n`
  }
})

ret += `\n/** 查询列表 */
const queryList = async () => {
  loading.value = true
  try {
    const data = await getList(queryParams)
    list.value = data.data.list
    total.value = data.data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  queryList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, ${primaryKey}?: ${primaryType}) => {
  formRef.value.open(type, ${primaryKey})
}

/** 导入 */
const importRef = ref()
const handleImport = () => {
  importRef.value.open()
}

/** 导出按钮操作 */
const exportLoading = ref(false)
const handleExport = async () => {
  try {
    // 导出的二次确认
    await ElMessageBox.confirm('是否确认导出数据项？')
    // 发起导出
    exportLoading.value = true
    const data = await exportXls(queryParams)
    // download.excel(data, '${params.name}.xls')
    // 创建 blob
    const blob = new Blob([data.data], { type: 'application/vnd.ms-excel' })
    // 创建 href 超链接，点击进行下载
    window.URL = window.URL || window.webkitURL
    const href = URL.createObjectURL(blob)
    const downA = document.createElement('a')
    downA.href = href
    downA.download = '${params.name}.xls'
    downA.click()
    // 销毁超连接
    window.URL.revokeObjectURL(href)
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (${primaryKey}: ${primaryType}) => {
  try {
    // 发起删除
    await deleteById(${primaryKey})
    ElMessage.success('删除成功')
    // 刷新列表
    await queryList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  queryList()
})
  
function handleSelectionChange(select) {
  selectedList.value = select
}

async function batchDelete(${primaryKey}s: ${primaryType}[]) {
  await batchDeleteByIds(${primaryKey}s)
  ElMessage.success('批量删除成功')
}

function batchOpt(cmd: string) {
  switch (cmd) {
    case 'batchDelete':
      const ${primaryKey}s = selectedList.value.map((select) => {
        return select.${primaryKey}
      })
      batchDelete(${primaryKey}s)
      break;
  
    default:
      break;
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
  .flex-1 {
    flex: 1 1 0%;
  }
  display: flex;
  text-align: right;
  padding-top: 12px;
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
  
  ret += `  </div>\n`

  ret += `  <${params.name}Au ref="formRef" @success="queryList" />\n`
  if (params.api.import) {
    ret += `  <${params.name}Import ref="importRef" @success="queryList" />\n`
  }

  ret += `</template>\n`

  ret += generatePageScript()

  fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + '.vue'), ret, 'utf-8')
}

function generateApi() {
  let ret = `import axios from 'axios'
// 后端地址
axios.defaults.baseURL = ''\n\n`

  ret += `// 查询列表
export async function getList(data: any) {
  return axios.post('${params.api.list || ''}', {
    data
  })
}
\n`

  ret += `// 查询详情
export const getDetail = (${primaryKey}: ${primaryType}) => {
  return axios.get('${params.api.detail || ''}?${primaryKey}=' + ${primaryKey})
}
\n`


  ret += `// 新增
export const postAdd = (data: any) => {
  return axios.post('${params.api.add || ''}', {
    data
  })
}
\n`

ret += `// 修改
export const putUpdate = (data: any) => {
  return axios.put('${params.api.edit || ''}', {
    data
  })
}
\n`

ret += `// 删除
export const deleteById = (${primaryKey}: ${primaryType}) => {
  return axios.delete('${params.api.delete || ''}?${primaryKey}=' + ${primaryKey})
}
\n`

  if (params.api.batchDelete) {
    ret += `// 批量删除
export const batchDeleteByIds = (${primaryKey}s: string[]) => {
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

fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + 'Api.ts'), ret, 'utf-8')
}

function generateAu() {
  let ret = `<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
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

  ret += `<script lang="ts" setup>
import { getDetail, postAdd, putUpdate } from './${params.name}Api'
import { FormRules, ElMessage } from 'element-plus'

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const typeKv = {
  'add': '新增',
  'update': '修改',
}

const formData = ref({\n`

params.fields.forEach(field => {
  switch (field.dataType) {
    case 'string':
      ret += `  ${field.key}: '',\n`
      break;
    case 'number':
      ret += `  ${field.key}: 0,\n`
      break;
    case 'select':
      ret += `  ${field.key}: undefined,\n`
      break;
    case 'boolean':
      ret += `  ${field.key}: false,\n`
      break;
    case 'date':
      ret += `  ${field.key}: '',\n`
      break;
    case 'dateRange':
      ret += `  ${field.key}: ['', ''],\n`
      break;
    case 'time':
      ret += `  ${field.key}: '',\n`
      break;
    default:
      ret += `  ${field.key}: '',\n`
      break;
  }
})
  ret += `})
const formRules = reactive<FormRules>({
})
const formRef = ref()\n`

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `const ${field.key}List = ref([] as any[])\n`
  }
});

ret += '\n'

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `function  query${field.key[0].toUpperCase() + field.key.substring(1, field.key.length)}List() {
  return []
}\n\n`
  }
});

ret += `
/** 打开弹窗 */
const open = async (type: string, ${primaryKey}?: ${primaryType}) => {
  dialogVisible.value = true
  dialogTitle.value = typeKv[type]
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (${primaryKey}) {
    formLoading.value = true
    try {
      const data = await getDetail(${primaryKey})
      formData.value = data.data
    } finally {
      formLoading.value = false
    }
  }

  // 选项\n`

params.fields.forEach(field => {
  if (field.dataType === 'select') {
    ret += `  query${field.key[0].toUpperCase() + field.key.substring(1, field.key.length)}List()\n`
  }
});

ret += `
}

defineExpose({ open })

// 定义 success 事件，用于操作成功后的回调
const emit = defineEmits(['success']) 

const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value
    if (formType.value === 'add') {
      await postAdd(data)
      ElMessage.success('新增成功')
    } else {
      await putUpdate(data)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {\n`

params.fields.forEach(field => {
  switch (field.dataType) {
    case 'string':
      ret += `    ${field.key}: '',\n`
      break;
    case 'number':
      ret += `    ${field.key}: 0,\n`
      break;
    case 'select':
      ret += `    ${field.key}: undefined,\n`
      break;
    case 'boolean':
      ret += `    ${field.key}: false,\n`
      break;
    case 'date':
      ret += `    ${field.key}: '',\n`
      break;
    case 'dateRange':
      ret += `    ${field.key}: ['', ''],\n`
      break;
    case 'time':
      ret += `    ${field.key}: '',\n`
      break;
    default:
      ret += `    ${field.key}: '',\n`
      break;
  }
})
  
ret += `  }
  formRef.value?.resetFields()
}
</script>
`

  fs.writeFileSync(path.join(params.path, params.name.includes('.') ? params.name : params.name + 'Au.vue'), ret, 'utf-8')
}

function generateImport() {
  let ret = `<template>
  <el-dialog v-model="dialogVisible" title="导入" width="400">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
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
      <el-icon><Upload/></el-icon>
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
<script lang="ts" setup>
import { downloadTemplate } from './${params.name}Api'
import { ElMessage } from 'element-plus'
import { Upload } from '@element-plus/icons-vue';

const dialogVisible = ref(false)
const formLoading = ref(false)
const uploadRef = ref()
const importUrl = '${params.api.import || ''}'
const fileList = ref([])
const updateSupport = ref(0)

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
  updateSupport.value = 0
  fileList.value = []
  resetForm()
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  if (fileList.value.length == 0) {
    ElMessage.error('请上传文件')
    return
  }
  // 提交请求
  formLoading.value = true
  uploadRef.value!.submit()
}

/** 文件上传成功 */
const emits = defineEmits(['success'])
const submitFormSuccess = (response: any) => {
  if (response.code !== 0) {
    ElMessage.error(response.msg)
    formLoading.value = false
    return
  }
  // 拼接提示语
  const data = response.data
  // let text = '上传成功数量：' + data.length + ';'
  // ElMessage.success(text)
  formLoading.value = false
  dialogVisible.value = false
  // 发送操作成功的事件
  emits('success')
}

/** 上传错误提示 */
const submitFormError = (): void => {
  ElMessage.error('上传失败，请您重新上传！')
  formLoading.value = false
}

/** 重置表单 */
const resetForm = async (): Promise<void> => {
  // 重置上传状态和文件
  formLoading.value = false
  await nextTick()
  uploadRef.value?.clearFiles()
}

/** 文件数超出提示 */
const handleExceed = (): void => {
  ElMessage.error('最多只能上传一个文件！')
}

/** 下载模板操作 */
const importTemplate = async () => {
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
</script>`

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