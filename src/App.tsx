import { Inspector } from './pages/Inspector';
import { BatchHistoryPage } from './pages/BatchHistoryPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inspector />} />
        <Route path="/history" element={<BatchHistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
