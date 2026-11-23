import { Inspector } from './pages/Inspector';
import { InspectionHistoryPage } from './pages/InspectionHistoryPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inspect" element={<Inspector />} />
        <Route path="/history" element={<InspectionHistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
