import { Routes, Route, Navigate } from 'react-router-dom';
import { TaskList } from './features/tasks/TaskList';
import { AuthPage } from './features/auth/AuthPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { useAuth } from './features/auth/AuthContext';
import { CheckSquare, LogOut, User as UserIcon } from 'lucide-react';
import { DevTimeMachine } from './components/DevTimeMachine';

function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DevTimeMachine />
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800 text-sm tracking-tight">
              Self Management
            </span>
          </div>

          {/* Navigation & User Profile */}
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-3 text-xs font-medium text-slate-500">
              <span className="text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
                Today
              </span>
              <span className="cursor-not-allowed opacity-50" title="Coming soon">
                Habits
              </span>
              <span className="cursor-not-allowed opacity-50" title="Coming soon">
                Goals
              </span>
            </nav>

            <div className="h-4 w-px bg-slate-200" />

            {/* Authenticated User Status */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100 py-1 px-2.5 rounded-full font-medium">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[140px] truncate" title={user?.email}>
                  {user?.email}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out of your account"
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition p-1 rounded-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
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

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
