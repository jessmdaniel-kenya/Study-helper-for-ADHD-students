import TinkersWorkbench from '../components/Games/TinkersWorkbench'

export default function Game() {
  return (
    <>
      <TinkersWorkbench />
      <div className="card soon gap">
        <strong>Leaderboard </strong>
        <span className="soon-badge">Coming soon, opt-in</span>
        <p className="hint">Community goals we reach together, never rankings of people.</p>
      </div>
    </>
  )
}