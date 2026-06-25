import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { migrateReviewSchedulesIfNeeded } from './db/api';
import { seedDatabase } from './db/seed';
import './index.css';

registerSW({ immediate: true });

async function bootstrap() {
  await seedDatabase();
  await migrateReviewSchedulesIfNeeded();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

bootstrap().catch((error: unknown) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML =
      '<main style="font-family:sans-serif;padding:2rem"><h1>起動に失敗しました</h1><p>ブラウザの保存領域を確認して、再読み込みしてください。</p></main>';
  }
  console.error(error);
});
