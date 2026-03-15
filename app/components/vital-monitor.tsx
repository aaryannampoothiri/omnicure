"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DataPoint = {
  time: string;
  value: number;
};

type VitalMonitorProps = {
  data: DataPoint[];
  label: string;
};

export default function VitalMonitor({ data, label }: VitalMonitorProps) {
  return (
    <article className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="ui-header text-[var(--text-heading)]">Vital Monitor</h3>
        <span className="ui-label text-[var(--text-muted)]">{label}</span>
      </div>

      <div className="mt-4 h-56 rounded-lg border border-[var(--border)] bg-white p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 6, bottom: 0 }}>
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              contentStyle={{
                border: "1px solid #E7E7E7",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#057C8B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
