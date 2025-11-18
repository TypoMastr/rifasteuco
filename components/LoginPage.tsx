import React, { useState, useEffect } from 'react';
import { FingerprintIcon } from './icons';
import { 
    isBiometricSupportAvailable,
    isBiometricRegistered,
    authenticateWithBiometrics
} from '../services/biometrics';

interface LoginPageProps {
    onLoginSuccess: (isReadOnly?: boolean) => void;
}

const KeyIcon: React.FC<React.ComponentProps<'svg'>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isExiting, setIsExiting] = useState(false);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleSuccessfulLogin = (isReadOnly: boolean = false) => {
        setError('');
        setIsExiting(true);
        setTimeout(() => {
            onLoginSuccess(isReadOnly);
        }, 400); // Corresponds to the exit animation duration
    };

    const handleBiometricLogin = async () => {
        setIsAuthenticating(true);
        setError('');
        const success = await authenticateWithBiometrics();
        if (success) {
            handleSuccessfulLogin(false); // Biometric is always full-access
        } else {
            // User might have cancelled, don't show an error unless it's a real failure.
            // For simplicity, we just stop the authenticating state.
            setIsAuthenticating(false);
        }
    };
    
    useEffect(() => {
        const checkAndAttemptBiometrics = async () => {
            if (isBiometricSupportAvailable() && isBiometricRegistered()) {
                setIsBiometricAvailable(true);
                await handleBiometricLogin();
            }
        };
        checkAndAttemptBiometrics();
    }, []);


    const handlePasswordLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'rifa396') {
            handleSuccessfulLogin(false);
        } else if (password === 'rifasteuco') {
            handleSuccessfulLogin(true);
        } else {
            setError('Senha incorreta. Tente novamente.');
            setPassword('');
        }
    };


    return (
        <div className="bg-background min-h-screen flex items-center justify-center p-4">
            <div className={`w-full max-w-sm mx-auto bg-surface rounded-2xl shadow-card border border-stroke p-8 text-center ${isExiting ? 'animate-fade-out-scale' : ''}`}>
                <img 
                    src="https://teuco.com.br/rifas/icone_rifas.png" 
                    alt="Ícone Rifas TEUCO" 
                    className="w-24 h-24 mx-auto mb-4 animate-icon-enter animate-float" 
                />
                <h1 
                    className="text-2xl font-bold text-primary mb-2 animate-fade-in"
                    style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}
                >
                    Rifas TEUCO
                </h1>
                <p 
                    className="text-text-secondary mb-6 animate-fade-in"
                    style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}
                >
                     {isAuthenticating 
                        ? 'Aguardando biometria...' 
                        : 'Faça login para continuar.'
                    }
                </p>

                <div className="mt-8 w-full animate-fade-in" style={{ animationDelay: '900ms', animationFillMode: 'backwards' }}>
                     {isAuthenticating ? (
                        <div className="flex justify-center items-center h-24">
                           <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <form onSubmit={handlePasswordLogin} className="space-y-4">
                                <div className="relative flex-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <KeyIcon className="h-5 w-5 text-text-secondary" />
                                    </span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-stroke rounded-md focus:ring-primary focus:border-primary bg-white text-text-primary"
                                        placeholder="Senha"
                                        aria-label="Senha"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 px-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                >
                                    Entrar com Senha
                                </button>
                            </form>

                             {isBiometricAvailable && (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-stroke" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-surface px-2 text-sm text-text-secondary">ou</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleBiometricLogin} 
                                        className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        Entrar com biometria
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {error && <p className="text-danger text-sm mt-4 text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;