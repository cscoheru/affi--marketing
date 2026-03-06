'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Heart, MessageCircle, Trash2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Comment } from '@/lib/blog/types'

interface CommentItemProps {
  comment: Comment
  onReply: (content: string, parentId: string) => void
  onDelete?: (id: string) => void
  depth?: number
}

export function CommentItem({ comment, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [likes, setLikes] = useState(comment.likes)

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent, comment.id)
      setReplyContent('')
      setShowReplyForm(false)
    }
  }

  const isOwner = comment.author.id === 'current-user'
  const maxDepth = 2

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-border' : ''}`}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
            <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author.name}</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setLikes(l => l + 1)}
              >
                <Heart className={`h-3.5 w-3.5 mr-1 ${likes > comment.likes ? 'fill-primary text-primary' : ''}`} />
                {likes}
              </Button>
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  回复
                </Button>
              )}
              {isOwner && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  删除
                </Button>
              )}
            </div>
          </div>
        </div>

        {showReplyForm && (
          <div className="mt-3 ml-11 space-y-2">
            <Textarea
              placeholder="写下你的回复..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-20 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent('')
                }}
              >
                取消
              </Button>
              <Button size="sm" onClick={handleReply}>
                发布回复
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-0">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
