'use client'

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DashboardLayout } from '@/components/dashboard-layout'
import { StatsOverview } from '@/components/stat-card'
import {
  mockAnalytics,
  mockContentPerformance,
  mockTrendData,
  mockPlatformDistribution,
} from '@/lib/mock-data'

const trendConfig = {
  revenue: {
    label: '收入 ($)',
    color: '#2563eb',
  },
  views: {
    label: '阅读量',
    color: '#10b981',
  },
}

const platformConfig = {
  Blogger: { label: 'Blogger', color: '#2563eb' },
  Medium: { label: 'Medium', color: '#10b981' },
  WordPress: { label: 'WordPress', color: '#f59e0b' },
  other: { label: '其他', color: '#6b7280' },
}

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="数据看板">
      <div className="flex flex-col gap-6">
        {/* Stats overview */}
        <StatsOverview data={mockAnalytics} />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Revenue trend */}
          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">收入与阅读趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendConfig} className="h-[300px] w-full">
                <AreaChart data={mockTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} width={50} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={50} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="url(#fillRevenue)"
                    strokeWidth={2}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="views"
                    stroke="#10b981"
                    fill="url(#fillViews)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Platform distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">平台分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={platformConfig} className="mx-auto h-[300px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={mockPlatformDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={2}
                  >
                    {mockPlatformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Content performance ranking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">内容表现排行</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>内容标题</TableHead>
                  <TableHead className="text-right">阅读量</TableHead>
                  <TableHead className="text-right">点击量</TableHead>
                  <TableHead className="text-right">转化数</TableHead>
                  <TableHead className="text-right">收入</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockContentPerformance.map((content, index) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{content.title}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{content.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{content.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{content.conversions}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">${content.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
