import Placeholder from '../components/Shared/Placeholder'

export default function Study() {
  return (
    <Placeholder
      label="Study"
      title="Study room"
      text="Questions and flashcards made only from your own notes."
      points={[
        'Multiple choice and write-in-your-own-words questions',
        'Every answer explained, right or wrong, with a quote from your notes',
        'Pick any material from your library to start',
      ]}
    />
  )
}