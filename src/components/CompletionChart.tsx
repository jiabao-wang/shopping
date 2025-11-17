"use client"
import { Doughnut } from "react-chartjs-2";
import { 
  Chart as ChartJS,
  ArcElement 
} from "chart.js";
ChartJS.register(ArcElement);

export default function CompletionChart({ completed, total }) {
  const chartData = {
    labels: ["完成订单", "其他"],
    datasets: [
      {
        data: [completed, total - completed],
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-3">订单完成率</h3>
      <Doughnut data={chartData} />
    </div>
  );
}
