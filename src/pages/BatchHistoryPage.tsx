import { useNavigate } from 'react-router-dom';
import { BatchHistory } from '../components/inspector/BatchHistory';
import { Navbar } from '../components/Navbar';

export function BatchHistoryPage() {
  const navigate = useNavigate();

  return (
    <main className="w-full min-h-screen bg-[#f8fbfe] bg-[radial-gradient(ellipse_90%_70%_at_20%_-10%,rgba(0,102,255,0.09),transparent_60%),radial-gradient(ellipse_80%_60%_at_85%_15%,rgba(39,223,188,0.11),transparent_55%),radial-gradient(ellipse_90%_60%_at_50%_105%,rgba(16,185,129,0.08),transparent_60%),radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.85),rgba(240,246,253,0.95))]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/15 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-36 w-[540px] h-[540px] rounded-full bg-gradient-to-bl from-emerald-300/15 via-teal-200/10 to-transparent blur-3xl" />
      </div>
      <div className="relative flex flex-col w-full">
        <div className="p-4 sm:p-gutter-desktop flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full">
          <Navbar />
          <BatchHistory onOpen={() => navigate('/')} />
        </div>
      </div>
    </main>
  );
}
