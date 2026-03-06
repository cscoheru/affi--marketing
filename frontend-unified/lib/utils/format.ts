/**
 * 格式化工具函数
 * 用于处理货币、评分、转化率等数据格式化
 */

/**
 * 格式化货币金额
 * @param value - 货币值（string 或 number）
 * @returns 格式化后的货币字符串，如 "$1,234.56"
 */
export function formatCurrency(value: string | number | undefined): string {
  if (!value) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

/**
 * 格式化评分
 * @param value - 评分值（string 或 number）
 * @returns 格式化后的评分字符串，如 "4.5"
 */
export function formatRating(value: string | number | undefined): string {
  if (!value) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '-'
  return num.toFixed(1)
}

/**
 * 计算转化率
 * @param clicks - 点击数
 * @param conversions - 转化数
 * @returns 转化率百分比字符串，如 "3.45"
 */
export function calculateConversionRate(clicks: number, conversions: number): string {
  if (clicks === 0) return '0.00'
  const rate = (conversions / clicks) * 100
  return rate.toFixed(2)
}

/**
 * 格式化数字（添加千位分隔符）
 * @param value - 数值
 * @returns 格式化后的数字字符串，如 "1,234"
 */
export function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * 格式化日期
 * @param dateStr - 日期字符串
 * @returns 格式化后的日期字符串，如 "2024-03-06"
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return '-'
  }
}

/**
 * 格式化日期时间
 * @param dateStr - 日期时间字符串
 * @returns 格式化后的日期时间字符串，如 "2024-03-06 14:30"
 */
export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

/**
 * 格式化相对时间
 * @param dateStr - 日期字符串
 * @returns 相对时间字符串，如 "3 天前"、"刚刚"
 */
export function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    if (diffHour < 24) return `${diffHour} 小时前`
    if (diffDay < 30) return `${diffDay} 天前`
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} 个月前`
    return `${Math.floor(diffDay / 365)} 年前`
  } catch {
    return '-'
  }
}

/**
 * 截断文本
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本，如 "Hello..."
 */
export function truncateText(text: string | undefined, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小，如 "1.5 MB"
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}
