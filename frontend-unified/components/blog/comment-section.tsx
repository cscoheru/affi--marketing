'use client'

import { useState } from 'react'
import { useBlogStore } from '@/lib/blog/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Comment } from '@/lib/blog/types'
import { MessageCircle } from 'lucide-react'

interface CommentSectionProps {
  articleId: string
  comments: Comment[]
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (parentId: string) => void }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </span>
          </div>
          <p className="text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onReply(comment.id)}>
              回复
            </Button>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 pl-4 border-l-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} onReply={onReply} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentSection({ articleId, comments }: CommentSectionProps) {
  const { addComment } = useBlogStore()
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await addComment(articleId, newComment, replyTo || undefined)
      setNewComment('')
      setReplyTo(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        评论 ({comments.length})
      </h3>

      {/* New Comment Form */}
      <div className="mb-8">
        <Textarea
          placeholder={replyTo ? `回复 ${comments.find(c => c.id === replyTo)?.author.name || '用户'}...` : '写下你的评论...'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="mb-3"
        />
        <div className="flex justify-between items-center">
          {replyTo && (
            <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
              取消回复
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {replyTo && <div />}
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
              {submitting ? '提交中...' : '发表评论'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onReply={setReplyTo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          暂无评论，快来抢沙发吧！
        </div>
      )}
    </div>
  )
}
