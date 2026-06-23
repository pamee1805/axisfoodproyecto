import { Inbox } from 'lucide-react'

function EmptyState({ className = '', icon: Icon = Inbox, text, title }) {
  return (
    <div className={['empty-state empty-state-common', className].filter(Boolean).join(' ')}>
      <Icon size={24} />
      {title ? <strong>{title}</strong> : null}
      <span>{text}</span>
    </div>
  )
}

export default EmptyState


