'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useBlogStore } from '@/lib/blog/store'

export function CategoryFilter() {
  const { categories, filters, setFilters } = useBlogStore()

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Button
          variant={filters.category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ category: '' })}
          className="shrink-0"
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={filters.category === category.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ category: category.slug })}
            className="shrink-0"
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
