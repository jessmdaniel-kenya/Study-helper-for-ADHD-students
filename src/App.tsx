// src/App.tsx
import { useEffect } from 'react'
import { HashRouter, Navigate, Routes, Route } from 'react-router-dom'
import { useAppStore } from './stores/useAppStore'
import { listMaterials } from './lib/materials'
import { supabase, supabaseConfigured } from './lib/supabase'

import AppLayout from './components/Shared/AppLayout'
import Home from './pages/Home'
import Resources from './pages/Resources'
import Study from './pages/Study'
import Game from './pages/Game'
import EnergyCheckin from './pages/EnergyCheckIn'
import Feed from './pages/Feed'
import Landing from './pages/Landing'
import Auth from './pages/Auth'

export default function App() {
  const setMaterials = useAppStore((state) => state.setMaterials)

  useEffect(() => {
    let active = true
    let generation = 0
    const refreshMaterials = async () => {
      const current = ++generation
      try {
        // Visitors on the landing page have not chosen guest mode yet, so do not
        // create an anonymous session for them; refresh once they sign in.
        if (supabaseConfigured) {
          const { data } = await supabase.auth.getSession()
          if (!data.session) {
            if (active && current === generation) setMaterials([])
            return
          }
        }
        const materials = await listMaterials()
        if (active && current === generation) setMaterials(materials)
      } catch {
        if (active && current === generation) setMaterials([])
      }
    }

    void refreshMaterials()
    if (!supabaseConfigured) return () => { active = false }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => { if (active) void refreshMaterials() }, 0)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [setMaterials])

  return (
    <HashRouter>
      <Routes>
        {/* Public entry: landing page, then guest start / sign in */}
        <Route path="/" element={<Landing />} />
        <Route path="/start" element={<Auth />} />

        {/* The app itself runs inside the responsive sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/study" element={<Study />} />
          <Route path="/game" element={<Game />} />
          <Route path="/energy" element={<EnergyCheckin />} />
          <Route path="/feed" element={<Feed />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}