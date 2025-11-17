import { OrderStatus } from "@prisma/client";
import { ClipboardList, Package, AlertTriangle, CheckCircle } from "lucide-react";

interface Props {
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string;
  completedAt?: string;
  delayedAt?: string;
}

const statusSteps = [
  { key: "INITIALIZED" as const, label: "已下单", Icon: ClipboardList, field: "createdAt" },
  { key: "SHIPPED" as const, label: "已发货", Icon: Package, field: "shippedAt" },
  { key: "DELAYED" as const, label: "延期", Icon: AlertTriangle, field: "delayedAt" },
  { key: "COMPLETED" as const, label: "已完成", Icon: CheckCircle, field: "completedAt" },
];

export default function OrderTimeline(props: Props) {
  const currentIndex = statusSteps.findIndex(s => s.key === props.status);

  return (
    <div className="relative space-y-6 pl-4">
      {statusSteps.map((step, idx) => {
        const active = idx <= currentIndex;
        const date = (props as any)[step.field];
        const Icon = step.Icon;

        return (
          <div className="relative flex items-start gap-3" key={step.key}>
            {/* Vertical connector line */}
            {idx < statusSteps.length - 1 && (
              <div
                className={`absolute left-3 top-3 h-full w-0.5 transform -translate-x-1/2
                  ${active ? "bg-blue-600" : "bg-gray-300"}`}
              />
            )}

            {/* Step circle with icon */}
            <div
              className={`relative flex items-center justify-center w-6 h-6 rounded-full
                ${active ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <Icon
                className={`w-4 h-4
                  ${active ? "text-white" : "text-gray-500"}`}
              />
            </div>

            {/* Step label and date */}
            <div className="flex-1">
              <div className={`font-medium ${active ? "text-gray-900" : "text-gray-500"}`}>
                {step.label}
              </div>
              {date && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(date).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}