'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VuePlaceholderProps {
  title: string
  description: string
  icon?: string
}

export function VuePlaceholder({ title, description, icon = '🚧' }: VuePlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>This module is being updated and will be available soon.</p>
        </div>
      </CardContent>
    </Card>
  )
}
