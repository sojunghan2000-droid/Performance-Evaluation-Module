import React, { useState } from 'react';
import Dashboard from './components/Dashboard';

const EVALUATION_PERIODS: { value: string; label: string }[] = (() => {
  const items: { value: string; label: string }[] = [];
  for (let y = 2025; y <= 2027; y++) {
    items.push({ value: `${y}-H1`, label: `${y}년 상반기` });
    items.push({ value: `${y}-H2`, label: `${y}년 하반기` });
  }
  return items;
})();

const App: React.FC = () => {
  const [period, setPeriod] = useState<string>(EVALUATION_PERIODS[0].value);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">성과 평가 시스템</h1>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="period-select" className="text-sm font-medium text-gray-600 sr-only">
              평가 기간
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded-md py-1.5 pl-3 pr-8 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {EVALUATION_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} 평가
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard period={period} />
      </main>
    </div>
  );
};

export default App;