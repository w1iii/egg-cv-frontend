import { Inspector } from './pages/Inspector';
import { BatchHistoryPage } from './pages/BatchHistoryPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inspect" element={<Inspector />} />
        <Route path="/history" element={<BatchHistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
