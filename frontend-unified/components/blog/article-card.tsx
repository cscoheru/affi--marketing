'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Article } from '@/lib/blog/types'

interface ArticleCardProps {
  article: Article
  featured?: boolean
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  const categoryColors: Record<string, string> = {
    'bg-blue-500': 'bg-blue-500 text-white',
    'bg-green-500': 'bg-green-500 text-white',
    'bg-yellow-500': 'bg-yellow-500 text-foreground',
    'bg-pink-500': 'bg-pink-500 text-white',
    'bg-indigo-500': 'bg-indigo-500 text-white',
  }

  return (
    <Link href={`/blog/${article.slug}`}>
      <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${featured ? 'md:flex md:h-64' : ''}`}>
        {article.coverImage && (
          <div className={`relative overflow-hidden ${featured ? 'md:w-1/2 h-48 md:h-full' : 'h-48'}`}>
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}
        <div className={`flex flex-col ${featured ? 'md:w-1/2' : ''}`}>
          <CardContent className={`flex-1 ${featured ? 'p-6' : 'p-4'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={categoryColors[article.category.color] || 'bg-primary text-primary-foreground'}>
                {article.category.name}
              </Badge>
              {article.publishedAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: zhCN })}
                </span>
              )}
            </div>
            <h3 className={`font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2 ${featured ? 'text-xl' : 'text-lg'}`}>
              {article.title}
            </h3>
            <p className={`text-muted-foreground line-clamp-2 ${featured ? 'text-base' : 'text-sm'}`}>
              {article.excerpt}
            </p>
          </CardContent>
          <CardFooter className={`border-t bg-muted/30 ${featured ? 'p-4' : 'p-3'}`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={article.author.avatar} alt={article.author.name} />
                  <AvatarFallback>{article.author.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{article.author.name}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1 text-sm">
                  <Heart className="h-4 w-4" />
                  {article.likes}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  {article.comments.length}
                </span>
              </div>
            </div>
          </CardFooter>
        </div>
      </Card>
    </Link>
  )
}
