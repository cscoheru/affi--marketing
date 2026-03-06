'use client'

import { useBlogStore } from '@/lib/blog/store'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

export function CategoryFilter() {
  const { categories, filters, setFilters } = useBlogStore()

  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-2 pb-2">
        <Button
          variant={filters.category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilters({ category: '' })}
        >
          全部
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={filters.category === category.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilters({ category: category.slug })}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
