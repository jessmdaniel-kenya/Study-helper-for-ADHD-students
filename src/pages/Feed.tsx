// src/pages/Feed.tsx
import { useState } from 'react'

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPost.trim()) return

    const post: Post = {
      id: Date.now().toString(),
      author: 'You (Student)',
      content: newPost,
      likes: 0,
      time: 'Just now'
    }

    setPosts([post, ...posts])
    setNewPost('')
  }

  return (
    <div className="stack" style={{ gap: '20px' }}>
      <div className="card stack">
        <div className="badge">COMMUNITY HUB 🌐</div>
        <h2 className="section-title">Study Group Feed</h2>
        <p className="sub-text">Share tips, notes, and encouragement with your classmates ahead of tomorrow.</p>

        <form onSubmit={handleCreatePost} className="stack" style={{ marginTop: '12px' }}>
          <textarea 
            className="field" 
            placeholder="Share a study tip or question with the group..." 
            rows={3}
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
          ></textarea>
          <button type="submit" className="btn-primary">Post to Community 🚀</button>
        </form>
      </div>

      <div className="stack" style={{ gap: '12px' }}>
        {posts.map(p => (
          <div key={p.id} className="card stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b style={{ color: 'var(--a1)' }}>{p.author}</b>
              <span className="hint">{p.time}</span>
            </div>
            <p style={{ fontSize: '15px', lineHeight: '1.5' }}>{p.content}</p>
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '13px' }} onClick={() => {
                setPosts(posts.map(item => item.id === p.id ? { ...item, likes: item.likes + 1 } : item))
              }}>
                ❤️ {p.likes} Likes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}