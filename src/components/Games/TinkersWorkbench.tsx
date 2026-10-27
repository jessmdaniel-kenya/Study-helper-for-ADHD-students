import Placeholder from '../Shared/Placeholder'

export default function TinkersWorkbench() {
  return (
    <Placeholder
      label="Game"
      title="The Tinker’s Workbench"
      text="Finish sprints and questions to collect parts and build things."
      points={[
        'Every 4th completion unlocks a surprise item',
        'Your collection shows silhouettes so you can see what’s left to find',
        'Sound and animation stay under your control',
      ]}
    />
  )
}