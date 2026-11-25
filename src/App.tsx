import { Inspector } from './pages/Inspector';
import { InspectionHistoryPage } from './pages/InspectionHistoryPage';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inspect" element={<Inspector />} />
        <Route path="/history" element={<InspectionHistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f8fc] p-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-600">That page does not exist.</p>
      <Link className="font-semibold text-blue-700 underline" to="/">Return to dashboard</Link>
    </main>
  );
}

export default App;
