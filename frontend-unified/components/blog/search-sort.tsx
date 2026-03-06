'use client'

import { useState } from 'react'
import { useBlogStore } from '@/lib/blog/store'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

export function SearchSort() {
  const { filters, setFilters } = useBlogStore()
  const [searchValue, setSearchValue] = useState(filters.search)

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setFilters({ search: searchValue })
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索文章..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-10"
        />
      </div>
      <Select value={filters.sort} onValueChange={(value) => setFilters({ sort: value as any })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">最新</SelectItem>
          <SelectItem value="most-liked">最多点赞</SelectItem>
          <SelectItem value="most-commented">最多评论</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
