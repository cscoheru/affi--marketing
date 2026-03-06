'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBlogStore } from '@/lib/blog/store'

export function SearchSort() {
  const { filters, setFilters } = useBlogStore()

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索文章..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-10"
        />
      </div>
      <Select
        value={filters.sort}
        onValueChange={(value: 'latest' | 'most-liked' | 'most-commented') => 
          setFilters({ sort: value })
        }
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="排序方式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">最新发布</SelectItem>
          <SelectItem value="most-liked">最多点赞</SelectItem>
          <SelectItem value="most-commented">最多评论</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
