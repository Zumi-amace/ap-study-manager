import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage }))
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const NewLogPage = lazy(() =>
  import('./pages/NewLogPage').then((module) => ({ default: module.NewLogPage }))
);
const ReviewPage = lazy(() =>
  import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
);
const StudyPage = lazy(() =>
  import('./pages/StudyPage').then((module) => ({ default: module.StudyPage }))
);
const WeaknessPage = lazy(() =>
  import('./pages/WeaknessPage').then((module) => ({ default: module.WeaknessPage }))
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">
          読み込み中...
        </div>
      }
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="log/new" element={<NewLogPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="weakness" element={<WeaknessPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
