interface Props {
  data: Record<string, unknown>[]
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

export default function DataTable({ data }: Props) {
  if (!data || data.length === 0) return null

  const columns = Object.keys(data[0])

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col}>{formatCell(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
