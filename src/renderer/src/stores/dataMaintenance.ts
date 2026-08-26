import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== 查询SN ====================
export const useQuerySnStore = defineStore('querySn', () => {
  const sn = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setSn(value: string) {
    sn.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sn.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sn,
    serverUrl,
    responseResult,
    setSn,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加SN ====================
export const useAddSnStore = defineStore('addSn', () => {
  const sideA = ref('')
  const sideB = ref('')
  const sn = ref('')
  const machineName = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setSideA(value: string) {
    sideA.value = value
  }

  function setSideB(value: string) {
    sideB.value = value
  }

  function setSn(value: string) {
    sn.value = value
  }

  function setMachineName(value: string) {
    machineName.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sideA.value = ''
    sideB.value = ''
    sn.value = ''
    machineName.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sideA,
    sideB,
    sn,
    machineName,
    serverUrl,
    responseResult,
    setSideA,
    setSideB,
    setSn,
    setMachineName,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加SN（新版minio版本） ====================
export const useAddSnMinioStore = defineStore('addSnMinio', () => {
  const sn = ref('')
  const minioBase = ref('C:/Users/liuliyi/.local/bin/minio-new-data/deepiresults')
  const sideAJson = ref('')
  const sideAZip = ref('')
  const sideBJson = ref('')
  const sideBZip = ref('')
  const machineName = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sn.value = ''
    minioBase.value = 'C:/Users/liuliyi/.local/bin/minio-new-data/deepiresults'
    sideAJson.value = ''
    sideAZip.value = ''
    sideBJson.value = ''
    sideBZip.value = ''
    machineName.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sn,
    minioBase,
    sideAJson,
    sideAZip,
    sideBJson,
    sideBZip,
    machineName,
    serverUrl,
    responseResult,
    setResponseResult,
    clear
  }
})

// ==================== 删除SN ====================
export const useDeleteSnStore = defineStore('deleteSn', () => {
  const sn = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setSn(value: string) {
    sn.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sn.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sn,
    serverUrl,
    responseResult,
    setSn,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 查询Lot ====================
export const useQueryLotStore = defineStore('queryLot', () => {
  const lot = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setLot(value: string) {
    lot.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    lot.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    lot,
    serverUrl,
    responseResult,
    setLot,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加Lot ====================
export const useAddLotStore = defineStore('addLot', () => {
  const lot = ref('')
  const snList = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setLot(value: string) {
    lot.value = value
  }

  function setSnList(value: string) {
    snList.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    lot.value = ''
    snList.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    lot,
    snList,
    serverUrl,
    responseResult,
    setLot,
    setSnList,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 删除Lot ====================
export const useDeleteLotStore = defineStore('deleteLot', () => {
  const lot = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setLot(value: string) {
    lot.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    lot.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    lot,
    serverUrl,
    responseResult,
    setLot,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 查询VRS历史记录 ====================
export const useGetVrsHistoryStore = defineStore('getVrsHistory', () => {
  const sn = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setSn(value: string) {
    sn.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sn.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sn,
    serverUrl,
    responseResult,
    setSn,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 删除VRS历史记录 ====================
export const useDeleteVrsHistoryStore = defineStore('deleteVrsHistory', () => {
  const sn = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setSn(value: string) {
    sn.value = value
  }

  function setServerUrl(value: string) {
    serverUrl.value = value
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    sn.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sn,
    serverUrl,
    responseResult,
    setSn,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 获取AI过滤结果 ====================
export const useGetAiInferenceResultStore = defineStore('getAiInferenceResult', () => {
  const key = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    serverUrl,
    responseResult,
    setKey,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加AI过滤A面结果 ====================
export const useAddAiInferenceAStore = defineStore('addAiInferenceA', () => {
  const key = ref('')
  const value = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setValue(val: string) {
    value.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    value.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    value,
    serverUrl,
    responseResult,
    setKey,
    setValue,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加AI过滤B面结果 ====================
export const useAddAiInferenceBStore = defineStore('addAiInferenceB', () => {
  const key = ref('')
  const value = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setValue(val: string) {
    value.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    value.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    value,
    serverUrl,
    responseResult,
    setKey,
    setValue,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 查看AI详细结果 (tovrs) ====================
export const useViewAiDetailResultStore = defineStore('viewAiDetailResult', () => {
  const key = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    serverUrl,
    responseResult,
    setKey,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加AI详细结果A面 (tovrs) ====================
export const useAddAiDetailResultAStore = defineStore('addAiDetailResultA', () => {
  const key = ref('')
  const value = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setValue(val: string) {
    value.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    value.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    value,
    serverUrl,
    responseResult,
    setKey,
    setValue,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 按日期范围查询历史数据 ====================
export const useGetHistoryDataRangeStore = defineStore('getHistoryDataRange', () => {
  const rangeStart = ref('')
  const rangeEnd = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setRangeStart(val: string) {
    rangeStart.value = val
  }

  function setRangeEnd(val: string) {
    rangeEnd.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    rangeStart.value = ''
    rangeEnd.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    rangeStart,
    rangeEnd,
    serverUrl,
    responseResult,
    setRangeStart,
    setRangeEnd,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 按Key查询历史数据 ====================
export const useGetHistoryDataKeyStore = defineStore('getHistoryDataKey', () => {
  const key = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    serverUrl,
    responseResult,
    setKey,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加历史数据 ====================
export const PUT_HISTORY_DATA_VALUE_TEMPLATE = `{
  "id": "1",
  "record_id": "1",
  "lot": "2333444",
  "lot_record_id": "2333444_1",
  "serial_number": "20260204170259376109",
  "productName": "210477e",
  "decive_id": "3P-FCJ-001",
  "cur_side": "D",
  "result": "NG",
  "defectNum": 54,
  "defect_count_A": 16,
  "defect_count_B": 38,
  "defect_count_total": 27,
  "ngCount": 1,
  "okCount": 0,
  "NF_count": 0,
  "total_count": 1,
  "pcsNum": 4,
  "average_time": 0,
  "put_product_total_time": 0,
  "start_time": "17:02:53",
  "end_time": "17:02:01",
  "time": "20260204",
  "insert_time": "20260204 17:02:30.708",
  "GP_OX": 0,
  "channel": "NG",
  "is_retest": false,
  "pile_seq": "1",
  "panel_seq": "1"
}`

export const usePutHistoryDataStore = defineStore('putHistoryData', () => {
  const key = ref('')
  const value = ref(PUT_HISTORY_DATA_VALUE_TEMPLATE)
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setValue(val: string) {
    value.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    value.value = PUT_HISTORY_DATA_VALUE_TEMPLATE
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    value,
    serverUrl,
    responseResult,
    setKey,
    setValue,
    setServerUrl,
    setResponseResult,
    clear
  }
})

// ==================== 添加AI详细结果B面 (tovrs) ====================
export const useAddAiDetailResultBStore = defineStore('addAiDetailResultB', () => {
  const key = ref('')
  const value = ref('')
  const serverUrl = ref('http://localhost:9877')
  const responseResult = ref('')

  function setKey(val: string) {
    key.value = val
  }

  function setValue(val: string) {
    value.value = val
  }

  function setServerUrl(val: string) {
    serverUrl.value = val
  }

  function setResponseResult(result: string) {
    responseResult.value = result
  }

  function clear() {
    key.value = ''
    value.value = ''
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    key,
    value,
    serverUrl,
    responseResult,
    setKey,
    setValue,
    setServerUrl,
    setResponseResult,
    clear
  }
})
