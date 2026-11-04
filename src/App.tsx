// src/App.tsx
import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  const setMaterials = useAppStore((state) => state.setMaterials)

  useEffect(() => {
    let active = true
    let generation = 0
    const refreshMaterials = async () => {
      const current = ++generation
      try {
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
        {/* Everything routes through your new responsive layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/study" element={<Study />} />
          <Route path="/game" element={<Game />} />
          <Route path="/energy" element={<EnergyCheckin />} />
          <Route path="/feed" element={<Feed />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}