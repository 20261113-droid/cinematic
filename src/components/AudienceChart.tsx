import { Movie } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from "recharts";

interface Props {
  movies: Movie[];
}

export default function AudienceChart({ movies }: Props) {
  // Sort movies by rank
  const sortedMovies = [...movies].sort((a, b) => a.rank - b.rank);

  // Formatting utility for integers (e.g. 1,250,500)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ko-KR").format(num);
  };

  const barChartData = sortedMovies.map((movie) => ({
    name: movie.title,
    "일일 관객 (명)": movie.audiCnt,
    "누적 관객 (명)": movie.audiAcc,
    rank: movie.rank,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* 1. Daily Audience Bar Chart */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-sm p-6 shadow-xl">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600"></span>
          영화별 일일 관객 수 비교 (어제 기준)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis
                dataKey="name"
                stroke="#666666"
                tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "monospace" }}
                interval={0}
                tickFormatter={(value) => (value.length > 5 ? `${value.substring(0, 5)}...` : value)}
              />
              <YAxis
                stroke="#666666"
                tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(value) => `${formatNumber(value / 10000)}만`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#050505",
                  border: "1px solid #222222",
                  borderRadius: "0px",
                  color: "#f5f5f5",
                  fontSize: "11px",
                  fontFamily: "monospace"
                }}
                formatter={(value: any) => [`${formatNumber(value)} 명`, ""]}
              />
              <Bar
                dataKey="일일 관객 (명)"
                fill="url(#barGradient)"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Cumulative Audience Area Chart */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-sm p-6 shadow-xl">
        <h3 className="font-mono text-xs uppercase tracking-widest text-[#a3a3a3] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-white"></span>
          영화별 누적 관객 수 추이 (만 명)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={barChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
              <XAxis
                dataKey="name"
                stroke="#666666"
                tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "monospace" }}
                interval={0}
                tickFormatter={(value) => (value.length > 5 ? `${value.substring(0, 5)}...` : value)}
              />
              <YAxis
                stroke="#666666"
                tick={{ fill: "#a3a3a3", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(value) => `${formatNumber(value / 10000)}만`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#050505",
                  border: "1px solid #222222",
                  borderRadius: "0px",
                  color: "#f5f5f5",
                  fontSize: "11px",
                  fontFamily: "monospace"
                }}
                formatter={(value: any) => [`${formatNumber(value)} 명`, ""]}
              />
              <Area
                type="monotone"
                dataKey="누적 관객 (명)"
                stroke="#ffffff"
                fillOpacity={1}
                fill="url(#areaGradient)"
              />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
