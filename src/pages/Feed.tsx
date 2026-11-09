// src/pages/Feed.tsx
import { useState } from 'react'
import { Heart, MessageCircle, Send } from 'lucide-react'
import { reviewCommunityText, type SafetyReview } from '../lib/safetyApi'

interface Post {
  id: string;
  author: string;
  content: string;
  likes: number;
  time: string;
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', author: 'Class Rep (BDAT 2.2)', content: 'Check-in for tomorrow CAT: Make sure you review all definition sentences in the notes desk!', likes: 14, time: '2h ago' },
    { id: '2', author: 'Bahati M.', content: 'Shared an exhaustive flashcard set for structural principles. Good luck everyone!', likes: 9, time: '4h ago' }
  ])
  const [newPost, setNewPost] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [safetyReview, setSafetyReview] = useState<SafetyReview | null>(null)
  const [reviewError, setReviewError] = useState('')

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newPost.trim()
    if (!content || reviewing) return
    if (content.length > 2_000) {
      setReviewError('Posts must be 2,000 characters or fewer.')
      return
    }

    setReviewing(true)
    setReviewError('')
    setSafetyReview(null)
    try {
      const result = await reviewCommunityText(content)
      if (result.flagged) {
        setSafetyReview(result)
        return
      }

      const post: Post = {
        id: Date.now().toString(),
        author: 'You (Student)',
        content,
        likes: 0,
        time: 'Just now',
      }
      setPosts((current) => [post, ...current])
      setNewPost('')
    } catch (error) {
      setReviewError(error instanceof Error
        ? `The safety check could not run, so your draft was not posted. ${error.message}`
        : 'The safety check could not run, so your draft was not posted. Please try again.')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="page stack">
      <section className="card stack">
        <div className="badge"><MessageCircle size={15} aria-hidden="true" /> COMMUNITY HUB</div>
        <h2 className="section-title">Study Group Feed</h2>
        <p className="sub-text">Share tips, notes, and encouragement with your classmates ahead of tomorrow.</p>

        <form onSubmit={handleCreatePost} className="form-stack">
          <textarea 
            className="field" 
            placeholder="Share a study tip or question with the group..." 
            rows={3}
            value={newPost}
            maxLength={2_000}
            onChange={e => { setNewPost(e.target.value); setSafetyReview(null); setReviewError('') }}
          ></textarea>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="hint">{newPost.length}/2,000 · posts are checked for supportive wording</span>
            <button type="submit" className="btn-primary" disabled={reviewing || !newPost.trim()}>
              <Send size={16} aria-hidden="true" /> {reviewing ? 'Checking post…' : 'Post to community'}
            </button>
          </div>
          {safetyReview && (
            <p className="err" role="alert">
              This draft was not posted. {safetyReview.message} Edit the wording and try again.
            </p>
          )}
          {reviewError && <p className="err" role="alert">{reviewError}</p>}
        </form>
      </section>

      <div className="feed-list">
        {posts.map(p => (
          <div key={p.id} className="card stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b style={{ color: 'var(--a1)' }}>{p.author}</b>
              <span className="hint">{p.time}</span>
            </div>
            <p style={{ fontSize: '15px', lineHeight: '1.5' }}>{p.content}</p>
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary like-button" onClick={() => {
                setPosts(posts.map(item => item.id === p.id ? { ...item, likes: item.likes + 1 } : item))
              }}>
                <Heart size={15} aria-hidden="true" /> {p.likes} likes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
