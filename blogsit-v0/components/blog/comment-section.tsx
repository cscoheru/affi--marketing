'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CommentItem } from './comment-item'
import { useBlogStore } from '@/lib/blog/store'
import type { Comment } from '@/lib/blog/types'

interface CommentSectionProps {
  articleId: string
  comments: Comment[]
}

export function CommentSection({ articleId, comments }: CommentSectionProps) {
  const { addComment } = useBlogStore()
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    
    setIsSubmitting(true)
    try {
      await addComment(articleId, newComment)
      setNewComment('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (content: string, parentId: string) => {
    await addComment(articleId, content, parentId)
  }

  const totalComments = comments.reduce((acc, c) => 
    acc + 1 + (c.replies?.length || 0), 0
  )

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-xl font-semibold">评论 ({totalComments})</h3>
      </div>

      {/* New Comment Form */}
      <div className="mb-8 space-y-3">
        <Textarea
          placeholder="写下你的想法..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-24"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting || !newComment.trim()}>
            {isSubmitting ? '发布中...' : '发布评论'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          暂无评论，来发表第一条评论吧！
        </div>
      )}
    </div>
  )
}
