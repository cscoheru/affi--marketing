'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, type Material } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

const materialTypes = [
  { value: 'all', label: '全部类型' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'document', label: '文档' },
]

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 获取素材列表
  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params: any = { page: 1, pageSize: 10 }
      if (search) params.search = search
      if (typeFilter !== 'all') params.type = typeFilter

      const response = await materialsApi.list(params)
      setMaterials(response.data.items)
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '获取素材列表失败',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [])

  // 处理搜索
  const handleSearch = () => {
    fetchMaterials()
  }

  // 处理类型筛选
  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
  }

  useEffect(() => {
    fetchMaterials()
  }, [typeFilter])

  // 处理文件上传
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      await materialsApi.upload(formData)
      toast({
        title: '成功',
        description: '素材已上传',
      })
      setUploadDialogOpen(false)
      fetchMaterials()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '上传素材失败',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 处理文件下载
  const handleDownload = (material: Material) => {
    const url = materialsApi.getUrl(material.id)
    window.open(url, '_blank')
  }

  // 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return

    try {
      await materialsApi.delete(id)
      toast({
        title: '成功',
        description: '素材已删除',
      })
      fetchMaterials()
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '删除素材失败',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">素材库</h1>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>上传素材</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上传素材</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,.pdf,.doc,.docx"
                disabled={uploading}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
              />
              <p className="text-xs text-muted-foreground">
                支持的格式: 图片 (JPG, PNG, GIF)、视频 (MP4, MOV)、文档 (PDF, DOC, DOCX)
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>素材列表</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="搜索素材..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} variant="secondary">搜索</Button>
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materialTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无素材数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {material.type === 'image' ? '图片' :
                         material.type === 'video' ? '视频' : '文档'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(material.size)}</TableCell>
                    <TableCell>
                      {new Date(material.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(material)}
                        >
                          下载
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
