function ContextHelp({ className = '', item, items, label = 'Ayuda', text }) {
  const contentItems = item ? [item] : items || []

  if (!text && !contentItems.length) {
    return null
  }

  return (
    <div className={['context-help', className].filter(Boolean).join(' ')}>
      {text ? (
        <div className="context-help-item">
          <span className="context-help-icon">i</span>
          <div>
            <strong>{label}</strong>
            <p>{text}</p>
          </div>
        </div>
      ) : null}

      {contentItems.map((helpItem) => (
        <div className="context-help-item" key={helpItem.label}>
          <span className="context-help-icon">i</span>
          <div>
            <strong>{helpItem.label}</strong>
            <p>{helpItem.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ContextHelp


