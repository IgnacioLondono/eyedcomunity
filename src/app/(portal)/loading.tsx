export default function LoadingPortal() {
  return (
    <div className="loading-grid" aria-label="Cargando estadísticas">
      <div className="loading-hero shimmer" />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, index) => <div className="loading-card shimmer" key={index} />)}
      </div>
    </div>
  );
}
