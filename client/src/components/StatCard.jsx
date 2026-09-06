export default function StatCard({ label, value, caption, icon }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {caption && <small>{caption}</small>}
      </div>
    </article>
  );
}
