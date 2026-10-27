type Props = { label: string; title: string; text: string; points?: string[] }

export default function Placeholder({ label, title, text, points = [] }: Props) {
  return (
    <>
      <div className="step-label">{label}</div>
      <h2 className="section-title">{title}</h2>
      <p className="sub-text">{text}</p>
      <div className="card soon">
        <span className="soon-badge">Coming soon</span>
        {points.length > 0 && (
          <ul className="soon-list">
            {points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </div>
    </>
  )
}