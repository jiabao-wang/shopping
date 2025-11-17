// components/OrderStatsChart.tsx
"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrderStatsChartProps {
  data?: { labels?: string[]; datasets?: any[] };
  period: 'day' | 'month' | 'year';
}

export default function OrderStatsChart({ data, period }: OrderStatsChartProps) {
  const chartData = {
    labels: data?.labels || [],
    datasets: data?.datasets || []
  };

  const hasData = chartData.labels.length > 0 || chartData.datasets.length > 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `订单统计 - ${period === 'day' ? '最近7天' : period === 'month' ? '最近7月' : '最近7年'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
    },
  };

  return (
    <div className="h-64">
      {hasData ? (
        <Bar options={options} data={chartData} />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          暂无数据
        </div>
      )}
    </div>
  );
}