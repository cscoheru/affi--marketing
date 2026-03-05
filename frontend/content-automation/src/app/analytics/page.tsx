"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  DollarSign,
  FileText,
  ExternalLink
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

// Mock analytics data
const mockStats = {
  totalRevenue: 1247.89,
  revenueTrend: 15.3,
  totalViews: 45678,
  viewsTrend: 8.7,
  totalClicks: 1234,
  clicksTrend: -3.2,
  conversionRate: 2.7,
  conversionTrend: 0.5,
  publishedCount: 12,
};

const mockContentPerformance = [
  {
    id: 1,
    title: "Nespresso Vertuo Next 深度评测",
    views: 12453,
    clicks: 345,
    conversions: 8,
    revenue: 234.56,
  },
  {
    id: 2,
    title: "咖啡豆保存指南",
    views: 8765,
    clicks: 234,
    conversions: 5,
    revenue: 145.67,
  },
  {
    id: 3,
    title: "2024年最佳意式咖啡机推荐",
    views: 5678,
    clicks: 156,
    conversions: 3,
    revenue: 89.90,
  },
  {
    id: 4,
    title: "Breville Barista Express 评测",
    views: 4321,
    clicks: 98,
    conversions: 2,
    revenue: 56.78,
  },
];

export default function AnalyticsPage() {
  const stats = useMemo(
    () => ({
      revenue: {
        value: `$${mockStats.totalRevenue.toFixed(2)}`,
        trend: mockStats.revenueTrend,
        trendUp: true,
      },
      views: {
        value: formatNumber(mockStats.totalViews),
        trend: mockStats.viewsTrend,
        trendUp: true,
      },
      clicks: {
        value: formatNumber(mockStats.totalClicks),
        trend: mockStats.clicksTrend,
        trendUp: false,
      },
      conversion: {
        value: `${mockStats.conversionRate}%`,
        trend: mockStats.conversionTrend,
        trendUp: true,
      },
      published: {
        value: mockStats.publishedCount.toString(),
        trend: 0,
        trendUp: true,
      },
    }),
    []
  );

  const StatCard = ({
    title,
    value,
    trend,
    trendUp,
    icon: Icon,
  }: {
    title: string;
    value: string;
    trend: number;
    trendUp: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        {trend !== 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trendUp ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={
                trendUp ? "text-green-600" : "text-red-600"
              }
            >
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="总收入"
            value={stats.revenue.value}
            trend={stats.revenue.trend}
            trendUp={stats.revenue.trendUp}
            icon={DollarSign}
          />
          <StatCard
            title="总阅读量"
            value={stats.views.value}
            trend={stats.views.trend}
            trendUp={stats.views.trendUp}
            icon={Eye}
          />
          <StatCard
            title="总点击量"
            value={stats.clicks.value}
            trend={stats.clicks.trend}
            trendUp={stats.clicks.trendUp}
            icon={MousePointerClick}
          />
          <StatCard
            title="转化率"
            value={stats.conversion.value}
            trend={stats.conversion.trend}
            trendUp={stats.conversion.trendUp}
            icon={TrendingUp}
          />
          <StatCard
            title="已发布内容"
            value={stats.published.value}
            trend={stats.published.trend}
            trendUp={true}
            icon={FileText}
          />
        </div>

        {/* Content Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">内容表现排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      标题
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      阅读量
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      点击量
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      转化数
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      收入
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockContentPerformance.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(item.views)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(item.clicks)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.conversions}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
