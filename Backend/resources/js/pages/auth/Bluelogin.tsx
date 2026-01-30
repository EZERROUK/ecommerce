import ParticlesBackground from '@/components/ParticlesBackground';
import { router } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import React, { useState } from 'react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [authError, setAuthError] = useState<string | null>(null);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const normalizeAuthError = (raw?: string) => {
        if (!raw) return 'Email ou mot de passe incorrect.';

        const s = raw.toLowerCase();

        // Throttle: on garde le message serveur.
        if (s.includes('too many') || s.includes('trop') || s.includes('seconds') || s.includes('secondes') || s.includes('minutes')) {
            return raw;
        }

        // Identifiants invalides: message unifié.
        if (s.includes('credentials') || s.includes('identifiants') || s.includes('enregistrements') || s.includes('match')) {
            return 'Email ou mot de passe incorrect.';
        }

        return raw;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { email?: string; password?: string } = {};
        if (!email) newErrors.email = 'Email requis';
        else if (!validateEmail(email)) newErrors.email = 'Email invalide';
        if (!password) newErrors.password = 'Mot de passe requis';
        else if (password.length < 6) newErrors.password = 'Minimum 6 caractères';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setAuthError(null);
            return;
        }

        setIsLoading(true);
        setAuthError(null);

        router.post(
            route('login'),
            {
                email,
                password,
                remember: rememberMe,
            },
            {
                onError: (err) => {
                    setIsLoading(false);
                    const serverErrors = err as { email?: string; password?: string };
                    if (serverErrors.email || serverErrors.password) {
                        const normalized = normalizeAuthError(serverErrors.email ?? serverErrors.password);
                        setAuthError(normalized);
                        if (normalized === 'Email ou mot de passe incorrect.') {
                            setErrors({ ...serverErrors, email: normalized });
                        } else {
                            setErrors(serverErrors);
                        }
                    } else {
                        setErrors(serverErrors);
                        setAuthError('Connexion impossible. Veuillez réessayer.');
                    }
                },
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#0a0420] via-[#0e0a32] to-[#1B1749]">
            <ParticlesBackground />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl border border-slate-700 bg-white/5 shadow-xl backdrop-blur-md md:grid-cols-2">
                    {/* Branding */}
                    <div className="hidden flex-col items-center justify-center space-y-6 bg-gradient-to-br from-[#1B1749]/90 to-[#0e0a32]/90 p-8 text-center text-white md:flex">
                        <svg viewBox="0 0 24 24" className="animate-float h-20 w-20" stroke="currentColor" fill="none" strokeWidth="1.5">
                            <path d="M2.5 19.5l4-8-1-4 3.5-3.5 3.5 3.5-1 4 4 8" />
                            <path d="M19.5 19.5l-4-8 1-4-3.5-3.5L9.5 7.5l1 4-4 8" />
                        </svg>
                        <h2 className="text-3xl font-bold">X-Zone Technologie</h2>
                        <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        <p className="text-sm text-slate-300">L’excellence informatique au service des professionnels depuis 2001</p>
                        <div className="mt-8 flex flex-col space-y-4 text-sm">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <span>support@x-zone.ma</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" fill="none">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <span>+212 5 22 52 32 34</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="p-8 md:p-10">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Connexion</h1>
                            <p className="mt-2 text-sm text-slate-400">Entrez vos identifiants pour continuer</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {authError && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{authError}</div>
                            )}

                            <div className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                                        Adresse e-mail
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (authError) setAuthError(null);
                                                if (errors.email) setErrors({ ...errors, email: undefined });
                                            }}
                                            placeholder="admin@x-zone.ma"
                                            className={`block w-full rounded-lg border bg-slate-800 py-3 pr-3 pl-10 ${
                                                errors.email ? 'border-red-500 text-red-500' : 'border-slate-700 text-white'
                                            } focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none`}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                </div>

                                {/* Mot de passe */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
                                            Mot de passe
                                        </label>
                                        <a href={route('password.request')} className="text-sm font-medium text-red-500 hover:text-red-400">
                                            Mot de passe oublié ?
                                        </a>
                                    </div>
                                    <div className="relative">
                                        <LockKeyhole className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (authError) setAuthError(null);
                                                if (errors.password) setErrors({ ...errors, password: undefined });
                                            }}
                                            placeholder="••••••••"
                                            className={`block w-full rounded-lg border bg-slate-800 py-3 pr-10 pl-10 ${
                                                errors.password ? 'border-red-500 text-red-500' : 'border-slate-700 text-white'
                                            } focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-1 focus:ring-red-500"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                                    Se souvenir de moi
                                </label>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative flex w-full justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-red-500 hover:to-red-600 focus:ring-2 focus:ring-red-500 disabled:opacity-70"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                    {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                                </button>
                            </div>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-400">
                            Pas encore de compte ?{' '}
                            <a href={route('register')} className="font-medium text-red-500 hover:text-red-400">
                                Inscrivez-vous
                            </a>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="col-span-full border-t border-slate-700 bg-white/5 py-4 text-center text-sm text-slate-300">
                        Conception et Développement par{' '}
                        <a href="https://globalglimpse.ma" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">
                            @Globalglimpse.ma
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
