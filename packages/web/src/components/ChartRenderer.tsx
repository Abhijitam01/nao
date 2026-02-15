import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Props {
  data: Record<string, unknown>[]
  chartType: string
  xAxis: string
  yAxis: string
  title: string
}

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#2dd4bf']

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString()
  }
  return String(value)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
      backdropFilter: 'blur(8px)',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} style={{ color: entry.color, fontWeight: 500 }}>
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function ChartRenderer({ data, chartType, xAxis, yAxis, title }: Props) {
  if (!data || data.length === 0) return null

  // Detect multiple Y columns if yAxis contains a comma
  const yColumns = yAxis.includes(',')
    ? yAxis.split(',').map(s => s.trim())
    : [yAxis]

  // Detect all numeric columns if yAxis is empty
  const numericColumns = yColumns[0]
    ? yColumns
    : Object.keys(data[0] || {}).filter(
        key => key !== xAxis && typeof data[0][key] === 'number'
      )

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.08)"
            />
            <XAxis
              dataKey={xAxis}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatValue(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            {numericColumns.length > 1 && <Legend />}
            {numericColumns.map((col, idx) => (
              <Line
                key={col}
                type="monotone"
                dataKey={col}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
                activeDot={{ r: 6 }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.08)"
            />
            <XAxis
              dataKey={xAxis}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.1)' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatValue(v)}
            />
            <Tooltip content={<CustomTooltip />} />
            {numericColumns.length > 1 && <Legend />}
            {numericColumns.map((col, idx) => (
              <Bar
                key={col}
                dataKey={col}
                fill={COLORS[idx % COLORS.length]}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // Fallback to table
    return null
  }

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      {renderChart()}
    </div>
  )
}
