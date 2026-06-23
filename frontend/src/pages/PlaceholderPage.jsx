function PlaceholderPage({ title, description }) {
  return (
    <section className="module-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Módulo</p>
          <h2>{title}</h2>
        </div>
      </div>

      <article className="panel module-card">
        <h3>Módulo en construcción</h3>
        <p>{description}</p>
      </article>
    </section>
  )
}

export default PlaceholderPage


