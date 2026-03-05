import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    if (variant === 'destructive') {
      sonnerToast.error(title || '错误', {
        description,
      })
    } else {
      sonnerToast.success(title || '成功', {
        description,
      })
    }
  }

  return {
    toast,
  }
}
