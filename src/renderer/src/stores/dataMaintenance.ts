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
    serverUrl.value = 'http://localhost:9877'
    responseResult.value = ''
  }

  return {
    sideA,
    sideB,
    sn,
    serverUrl,
    responseResult,
    setSideA,
    setSideB,
    setSn,
    setServerUrl,
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
