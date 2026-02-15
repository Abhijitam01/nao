import ChartRenderer from './ChartRenderer'
import DataTable from './DataTable'

interface MessageData {
  sql: string
  chartType: string
  xAxis: string
  yAxis: string
  title: string
  description: string
  results: Record<string, unknown>[]
  rowCount: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: MessageData
  error?: string
}

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const { role, content, data, error } = message

  return (
    <div className={`message ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        {/* Error state */}
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Text content */}
        {content && (
          <div className="message-text">{content}</div>
        )}

        {/* Data visualization */}
        {data && (
          <>
            {/* SQL block */}
            <div className="sql-block">
              <div className="sql-block-header">
                <span>Generated SQL</span>
                <span className="row-count">
                  {data.rowCount} row{data.rowCount !== 1 ? 's' : ''}
                </span>
              </div>
              <pre>{data.sql}</pre>
            </div>

            {/* Description */}
            {data.description && (
              <p style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                padding: '0 4px',
              }}>
                {data.description}
              </p>
            )}

            {/* Chart or Table */}
            {data.results.length > 0 && (
              data.chartType === 'table' ? (
                <DataTable data={data.results} />
              ) : (
                <ChartRenderer
                  data={data.results}
                  chartType={data.chartType}
                  xAxis={data.xAxis}
                  yAxis={data.yAxis}
                  title={data.title}
                />
              )
            )}

            {data.results.length === 0 && (
              <div className="error-message">
                <span>📭</span>
                <span>No results found for this query.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
