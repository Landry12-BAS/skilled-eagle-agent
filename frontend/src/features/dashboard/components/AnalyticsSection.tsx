"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Users, UserCheck, UserX, MessageSquare, TrendingUp } from "lucide-react";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8000/api";

type AnalyticsData = {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  total_conversations: number;
  daily_signups: { date: string; clients: number }[];
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`flex items-center gap-4 p-5 rounded-2xl border ${color}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-black/60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${BACKEND_API_URL}/analytics/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-black/5 animate-pulse" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-black/5 animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mt-8 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-7 h-7 text-black/60" />}
          label="Total Clients"
          value={data.total_clients}
          color="border-black/10 bg-white"
        />
        <StatCard
          icon={<UserCheck className="w-7 h-7 text-green-600" />}
          label="Active Clients"
          value={data.active_clients}
          color="border-green-200 bg-green-50"
        />
        <StatCard
          icon={<UserX className="w-7 h-7 text-black/40" />}
          label="Inactive Clients"
          value={data.inactive_clients}
          color="border-black/10 bg-black/[0.02]"
        />
        <StatCard
          icon={<MessageSquare className="w-7 h-7 text-blue-600" />}
          label="Your Conversations"
          value={data.total_conversations}
          color="border-blue-200 bg-blue-50"
        />
      </div>

      {/* Area chart */}
      <div className="bg-white border border-black/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-black/50" />
          <h3 className="font-semibold text-sm">Client Growth — Last 7 Days</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.daily_signups} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="clientGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#000" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#00000060" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#00000060" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #0000001a", fontSize: "12px" }}
              cursor={{ stroke: "#00000015" }}
            />
            <Area
              type="monotone"
              dataKey="clients"
              stroke="#000"
              strokeWidth={2}
              fill="url(#clientGradient)"
              dot={{ fill: "#000", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
