import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        email: string;
        password: string;
        remember: boolean;
    }>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Connexion" />

            <div
                className="relative flex min-h-screen items-center justify-center bg-[#0e0a32] bg-cover bg-center px-6 py-12 font-['Montserrat']"
                style={{ backgroundImage: 'url(/storage/background/pattern.png)' }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 z-0 bg-black/60" />

                {/* Form Card */}
                <div className="animate-fade-in-down relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-xl bg-white/5 shadow-2xl backdrop-blur-md md:grid-cols-2">
                    {/* Left Illustration / Branding */}
                    <div className="hidden flex-col items-center justify-center bg-gradient-to-br from-[#1B1749] to-[#0e0a32] p-8 text-white md:flex">
                        <img src="/storage/logos/xzone_white.png" alt="X-Zone Logo" className="animate-fade-in mb-6 w-32" />
                        <h2 className="text-center text-2xl leading-snug font-bold">X-Zone Technologie</h2>
                        <p className="mt-2 text-center text-sm text-[#AFAFD4]">
                            Vente & location de matériel informatique, Intégration, Support, Réseaux, Maintenance.
                        </p>
                    </div>

                    {/* Right Form */}
                    <div className="p-8 md:p-12">
                        <form onSubmit={submit} className="animate-fade-in-up space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-white">Connexion à votre compte</h1>
                                <p className="mt-1 text-sm text-[#AFAFD4]">Accédez à vos services informatiques</p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="email" className="text-white">
                                        Adresse e-mail
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="admin@xzone.com"
                                        required
                                        className="bg-white text-[#1B1749]"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-white">
                                            Mot de passe
                                        </Label>
                                        {canResetPassword && (
                                            <TextLink href={route('password.request')} className="text-sm text-[#E92B26]">
                                                Oublié ?
                                            </TextLink>
                                        )}
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="bg-white text-[#1B1749]"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        checked={data.remember}
                                        onClick={() => setData('remember', !data.remember)}
                                    />
                                    <Label htmlFor="remember" className="text-white">
                                        Se souvenir de moi
                                    </Label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-[#E92B26] font-semibold transition-colors hover:bg-white hover:text-[#E92B26]"
                            >
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Connexion
                            </Button>

                            {status && <div className="text-center text-sm text-green-400">{status}</div>}

                            <p className="text-center text-sm text-[#AFAFD4]">
                                Pas encore de compte ?{' '}
                                <TextLink href={route('register')} className="font-medium text-[#E92B26]">
                                    Inscrivez-vous
                                </TextLink>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
