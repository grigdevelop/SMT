import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { TaskList } from './features/tasks/TaskList';
import { SkillsPage } from './features/skills/SkillsPage';
import { AdminPage } from './features/admin/AdminPage';
import { AuthPage } from './features/auth/AuthPage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { useAuth } from './features/auth/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { DevTimeMachine } from './components/DevTimeMachine';
import { BrandLogo } from './components/BrandLogo';
import { ThemeToggle } from './lib/theme-context';
import { Button } from './components/ui/Button';
import { Role } from '@self/contracts';

interface DashboardProps {
  view: 'tasks' | 'skills' | 'admin';
}

function Dashboard({ view }: DashboardProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-150">
      <DevTimeMachine />
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md shadow-2xs sticky top-0 z-30 transition-colors duration-150">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo & Brand & Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <BrandLogo className="w-7 h-7 sm:w-8 sm:h-8" />
              <span className="font-semibold text-foreground text-xs sm:text-sm tracking-tight hidden xs:inline">
                Self Management
              </span>
            </div>

            <nav className="flex items-center space-x-1 text-xs font-medium text-muted-foreground">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-md transition ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60'
                      : 'hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                Today
              </NavLink>
              <NavLink
                to="/skills"
                className={({ isActive }) =>
                  `px-2.5 py-1.5 rounded-md transition ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60'
                      : 'hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                Skills
              </NavLink>
              {user?.role === Role.ADMIN && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `px-2.5 py-1.5 rounded-md transition ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60'
                        : 'hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              <span
                className="cursor-not-allowed opacity-40 px-2 py-1.5 hidden md:inline"
                title="Coming soon"
              >
                Habits
              </span>
              <span
                className="cursor-not-allowed opacity-40 px-2 py-1.5 hidden md:inline"
                title="Coming soon"
              >
                Goals
              </span>
            </nav>
          </div>

          {/* Theme Toggle, User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted py-1 px-2 sm:px-2.5 rounded-full font-medium">
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span
                className="max-w-[100px] xs:max-w-[120px] sm:max-w-[160px] truncate text-foreground"
                title={user?.email}
              >
                {user?.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Sign out of your account"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {view === 'tasks' ? (
          <>
            <div className="mb-4 sm:mb-6 max-w-xl mx-auto text-left">
              <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                Today's Tasks
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Focus on what matters most today. Instant updates, zero friction.
              </p>
            </div>
            <TaskList />
          </>
        ) : view === 'skills' ? (
          <SkillsPage />
        ) : (
          <AdminPage />
        )}
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
            <Dashboard view="tasks" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <Dashboard view="skills" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={Role.ADMIN}>
            <Dashboard view="admin" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
