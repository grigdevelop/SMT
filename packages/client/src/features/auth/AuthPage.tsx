import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { LoginSchema, RegisterSchema } from '@self/contracts';
import type { LoginDto, RegisterDto } from '@self/contracts';
import { useAuth } from './AuthContext';
import { BrandLogo } from '../../components/BrandLogo';
import { Button } from '../../components/ui';
import { ThemeToggle } from '../../lib/theme-context';
import { cn } from '../../lib/utils';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isLogin = mode === 'login';
  const schema = isLogin ? LoginSchema : RegisterSchema;

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterDto) => {
    setServerError(null);
    try {
      if (isLogin) {
        await login(data as LoginDto);
      } else {
        await register(data);
      }
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center mb-4 shadow-sm rounded-xl">
          <BrandLogo size="lg" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin
            ? 'Sign in to access your daily tasks, habits, and goals'
            : 'Get started with zero-friction personal self-management'}
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 sm:px-10 shadow-sm border border-border rounded-xl">
          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...formRegister('email')}
                className={cn(
                  'block w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border transition shadow-xs outline-hidden focus:ring-2 bg-card text-foreground placeholder-muted-foreground',
                  errors.email
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive'
                    : 'border-border focus:border-primary focus:ring-primary/20',
                )}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                  <span>•</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Password
                </label>
                {!isLogin && (
                  <span className="text-2xs text-muted-foreground">Min. 8 characters</span>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  {...formRegister('password')}
                  className={cn(
                    'block w-full px-3.5 py-2.5 pr-10 text-base sm:text-sm rounded-lg border transition shadow-xs outline-hidden focus:ring-2 bg-card text-foreground placeholder-muted-foreground',
                    errors.password
                      ? 'border-destructive focus:border-destructive focus:ring-destructive/20 text-destructive'
                      : 'border-border focus:border-primary focus:ring-primary/20',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-destructive font-medium flex items-center gap-1">
                  <span>•</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : isLogin ? (
                  'Sign in'
                ) : (
                  'Create account'
                )}
              </Button>
            </div>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            {isLogin ? (
              <p className="text-xs text-muted-foreground">
                Don't have an account yet?{' '}
                <Link
                  to="/register"
                  onClick={() => {
                    setServerError(null);
                    reset();
                  }}
                  className="font-semibold text-primary hover:underline transition"
                >
                  Create one now
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  onClick={() => {
                    setServerError(null);
                    reset();
                  }}
                  className="font-semibold text-primary hover:underline transition"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
