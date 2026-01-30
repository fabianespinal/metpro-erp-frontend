export default function StatusPill({ status }) {
  const statusConfig = {
    Draft: { color: 'bg-gray-100 text-gray-800', icon: '📄' },
    Approved: { color: 'bg-blue-100 text-blue-800', icon: '✅' },
    Invoiced: { color: 'bg-green-100 text-green-800', icon: '💰' },
    Cancelled: { color: 'bg-red-100 text-red-800', icon: '❌' }
  }

  const config = statusConfig[status] || statusConfig.Draft

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span className="mr-1.5">{config.icon}</span>
      {status}
    </span>
  )
}