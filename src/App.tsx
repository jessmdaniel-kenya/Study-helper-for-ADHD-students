import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Shared/AppLayout';
import EnergyCheckIn from './pages/EnergyCheckIn';
import Feed from './pages/Feed';
import Quiz from './pages/Quiz';
import Resources from './pages/Resources';

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<EnergyCheckIn />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/resources" element={<Resources />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;