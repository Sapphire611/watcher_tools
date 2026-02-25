import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMongoCheckStore = defineStore('mongoCheck', () => {
  const analyzed = ref(false)
  const totalCount = ref(0)
  const uniqueCount = ref(0)
  const duplicateCount = ref(0)
  const snStats = ref<Array<{
    sn: string
    count: number
    indices: number[]
    isDuplicate: boolean
  }>>([])
  const uniqueSnList = ref<string[]>([])
  const searchText = ref('')
  const searchUniqueText = ref('')

  function setAnalyzed(value: boolean) {
    analyzed.value = value
  }

  function setStatistics(total: number, unique: number, duplicate: number) {
    totalCount.value = total
    uniqueCount.value = unique
    duplicateCount.value = duplicate
  }

  function setSnStats(stats: Array<{
    sn: string
    count: number
    indices: number[]
    isDuplicate: boolean
  }>) {
    snStats.value = stats
  }

  function setUniqueSnList(list: string[]) {
    uniqueSnList.value = list
  }

  function setSearchText(text: string) {
    searchText.value = text
  }

  function setSearchUniqueText(text: string) {
    searchUniqueText.value = text
  }

  function clear() {
    analyzed.value = false
    totalCount.value = 0
    uniqueCount.value = 0
    duplicateCount.value = 0
    snStats.value = []
    uniqueSnList.value = []
    searchText.value = ''
    searchUniqueText.value = ''
  }

  return {
    analyzed,
    totalCount,
    uniqueCount,
    duplicateCount,
    snStats,
    uniqueSnList,
    searchText,
    searchUniqueText,
    setAnalyzed,
    setStatistics,
    setSnStats,
    setUniqueSnList,
    setSearchText,
    setSearchUniqueText,
    clear
  }
})
