import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Shared/AppLayout'
import Placeholder from './components/Shared/Placeholder'
import Home from './pages/Home'
import EnergyCheckIn from './pages/EnergyCheckIn'
import Quiz from './pages/Quiz'
import Study from './pages/Study'
import Game from './pages/Game'
import Resources from './pages/Resources'
import Feed from './pages/Feed'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sprint" element={<EnergyCheckIn />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/study" element={<Study />} />
          <Route path="/game" element={<Game />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/feed" element={<Feed />} />
          <Route
            path="*"
            element={
              <Placeholder
                label="404"
                title="Page not found"
                text="That page doesn’t exist. Use the menu to head back."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}