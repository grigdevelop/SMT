import { TaskList } from './features/tasks/TaskList';
import { CheckSquare } from 'lucide-react';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">
              Self Management
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
            <span className="text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
              Today
            </span>
            <span className="cursor-not-allowed opacity-50">Habits</span>
            <span className="cursor-not-allowed opacity-50">Goals</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6 max-w-xl mx-auto text-left">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Today's Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">
            Focus on what matters most today. Instant updates, zero friction.
          </p>
        </div>

        <TaskList />
      </main>
    </div>
  );
}
