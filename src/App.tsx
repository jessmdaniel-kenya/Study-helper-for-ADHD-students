import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/Shared/NavBar';
import EnergyCheckIn from './pages/EnergyCheckIn';
import Feed from './pages/Feed';
import Resources from './pages/Resources';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#fbfaf8] text-[#2c2a29] font-sans">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<EnergyCheckIn />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;