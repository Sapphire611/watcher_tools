import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLotCheckStore = defineStore('lotCheck', () => {
  // 所有项列表
  const allItems = ref<string[]>([])

  // 搜索文本
  const searchText = ref('')

  // 添加项
  function addItems(items: string[]) {
    allItems.value.push(...items)
  }

  // 清空所有
  function clearAll() {
    allItems.value = []
    searchText.value = ''
  }

  // 重置搜索
  function clearSearch() {
    searchText.value = ''
  }

  // 设置搜索文本
  function setSearchText(text: string) {
    searchText.value = text
  }

  // 获取重复项
  function getDuplicates() {
    const itemCounts = new Map<string, number>()
    const itemIndices = new Map<string, number[]>()

    allItems.value.forEach((item, index) => {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1)
      if (!itemIndices.has(item)) {
        itemIndices.set(item, [])
      }
      itemIndices.get(item)!.push(index + 1)
    })

    const duplicates: Array<{
      item: string
      count: number
      indices: number[]
    }> = []

    itemCounts.forEach((count, item) => {
      if (count > 1) {
        duplicates.push({
          item,
          count,
          indices: itemIndices.get(item)!
        })
      }
    })

    return duplicates.sort((a, b) => b.count - a.count)
  }

  // 判断是否重复
  function isDuplicate(item: string): boolean {
    const itemCounts = new Map<string, number>()
    allItems.value.forEach((i) => {
      itemCounts.set(i, (itemCounts.get(i) || 0) + 1)
    })
    return (itemCounts.get(item) || 0) > 1
  }

  // 获取唯一项
  function getUniqueItems() {
    const itemCounts = new Map<string, number>()
    allItems.value.forEach((item) => {
      itemCounts.set(item, (itemCounts.get(item) || 0) + 1)
    })

    return Array.from(itemCounts.entries()).filter(([_, count]) => count === 1)
  }

  return {
    allItems,
    searchText,
    addItems,
    clearAll,
    clearSearch,
    setSearchText,
    getDuplicates,
    isDuplicate,
    getUniqueItems
  }
})
