"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Stats } from "@/lib/types";

interface ChartsProps {
  stats: Stats | null;
}

const BRANCH_COLORS = [
  "#34d399",
  "#60a5fa",
  "#f472b6",
  "#fbbf24",
  "#a78bfa",
  "#22d3ee",
];

export default function Charts({ stats }: ChartsProps) {
  const yearData = stats?.byYear
    ? Object.entries(stats.byYear).map(([year, count]) => ({
        year: `Year ${year}`,
        present: count,
      }))
    : [];

  const branchData = stats?.byBranch
    ? Object.entries(stats.byBranch).map(([branch, count]) => ({
        branch,
        present: count,
      }))
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-300">
          Present by Year
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="year" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#27272a55" }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 12,
                  color: "#e4e4e7",
                }}
              />
              <Bar dataKey="present" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-300">
          Present by Branch
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="branch" stroke="#71717a" fontSize={12} width={56} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#27272a55" }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 12,
                  color: "#e4e4e7",
                }}
              />
              <Bar dataKey="present" radius={[0, 6, 6, 0]}>
                {branchData.map((entry, i) => (
                  <Cell key={entry.branch} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
