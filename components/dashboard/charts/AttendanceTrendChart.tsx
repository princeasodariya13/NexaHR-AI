"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';

const data = [
  { name: 'Mon', present: 1100, absent: 50, leave: 30 },
  { name: 'Tue', present: 1150, absent: 40, leave: 28 },
  { name: 'Wed', present: 1120, absent: 45, leave: 35 },
  { name: 'Thu', present: 1180, absent: 35, leave: 33 },
  { name: 'Fri', present: 1050, absent: 80, leave: 50 },
];

export function AttendanceTrendChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full animate-pulse bg-[#F3F4F6] dark:bg-[#1E293B] rounded-xl" />;

  return (
    <div className="h-full w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
            itemStyle={{ color: '#111827', fontSize: '14px', fontWeight: 600 }}
          />
          <Area 
            type="monotone" 
            dataKey="present" 
            stroke="#111827" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPresent)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
