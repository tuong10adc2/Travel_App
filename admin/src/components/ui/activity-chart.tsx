"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ActivityPoint {
  label: string;
  users: number;
  reviews: number;
}

// CSS var thay vì hex cứng — tự đổi màu theo theme sáng/tối vì đây là chuỗi
// được recharts gán thẳng vào thuộc tính SVG (stroke/fill), trình duyệt hiện
// đại resolve var() trên presentation attribute như CSS bình thường.
const BRAND = "var(--brand-600)";
const WARNING = "var(--warning-600)";

export function ActivityChart({
  data,
  showUsers,
  showReviews,
}: {
  data: ActivityPoint[];
  showUsers: boolean;
  showReviews: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
            <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillReviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={WARNING} stopOpacity={0.25} />
            <stop offset="95%" stopColor={WARNING} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--foreground)",
            fontSize: 13,
          }}
        />
        {showUsers && (
          <Area
            type="monotone"
            dataKey="users"
            name="Người dùng mới"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#fillUsers)"
          />
        )}
        {showReviews && (
          <Area
            type="monotone"
            dataKey="reviews"
            name="Đánh giá mới"
            stroke={WARNING}
            strokeWidth={2}
            fill="url(#fillReviews)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
