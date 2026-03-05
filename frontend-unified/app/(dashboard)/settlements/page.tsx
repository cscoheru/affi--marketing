'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettlementsPage() {
  const settlements = [
    { id: 1, period: '2024-02', amount: 2345.67, status: 'paid', paidDate: '2024-03-01' },
    { id: 2, period: '2024-01', amount: 1876.43, status: 'paid', paidDate: '2024-02-01' },
    { id: 3, period: '2023-12', amount: 3120.89, status: 'paid', paidDate: '2024-01-01' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">结算管理</h1>
        <p className="text-muted-foreground">查看和管理你的收益结算</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>待结算</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">¥1,234</div>
            <p className="text-sm text-muted-foreground">预计 3 月底结算</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>累计收益</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">¥7,342</div>
            <p className="text-sm text-muted-foreground">过去 3 个月</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>下次结算</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3 月 31 日</div>
            <p className="text-sm text-muted-foreground">还有 26 天</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>结算历史</CardTitle>
          <CardDescription>过去的结算记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{s.period} 结算</p>
                  <p className="text-sm text-muted-foreground">支付日期: {s.paidDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">¥{s.amount.toLocaleString()}</p>
                  <span className="text-sm text-green-600">已支付</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
