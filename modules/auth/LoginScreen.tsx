
import React, { useState } from 'react';
import { useSettings } from '../../store/SettingsContext';
import apiService from '../../services/api';

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

interface LoginScreenProps {
    onLoginSuccess: (userType: 'standard' | 'admin') => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const { auth, addLog } = useSettings();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Call Backend API
            const response = await apiService.login(username, password);
            
            // Determine user type based on userType from API
            const userType = response.user.userType === 'admin' ? 'admin' : 'standard';
            
            addLog({ 
                userType: response.user.userType === 'admin' ? 'Admin' : 'Standard User', 
                status: 'success', 
                details: 'Login successful' 
            });
            
            onLoginSuccess(userType);
        } catch (err: any) {
            const errorMessage = err.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
            setError(errorMessage);
            addLog({ 
                userType: username || 'Unknown', 
                status: 'failed', 
                details: errorMessage 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen bg-[#BF0A30] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-10 md:p-12 relative z-10">
                <form onSubmit={handleLogin}>
                    <div className="mb-6">
                        <label className="block text-slate-700 text-lg font-bold mb-2" htmlFor="username">
                            ชื่อผู้ใช้งาน
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ชื่อผู้ใช้งาน"
                            className="bg-slate-50 text-slate-800 placeholder-slate-400 appearance-none border-2 border-slate-300 rounded-lg w-full py-3 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-[#BF0A30] focus:border-[#BF0A30] text-lg"
                            required
                            aria-label="Username"
                            autoComplete="username"
                        />
                    </div>
                    <div className="mb-8">
                        <label className="block text-slate-700 text-lg font-bold mb-2" htmlFor="password">
                            รหัสผ่าน
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="รหัสผ่าน"
                                className="bg-slate-50 text-slate-800 placeholder-slate-400 appearance-none border-2 border-slate-300 rounded-lg w-full py-3 px-4 pr-12 leading-tight focus:outline-none focus:ring-2 focus:ring-[#BF0A30] focus:border-[#BF0A30] text-lg"
                                required
                                aria-label="Password"
                                autoComplete="current-password"
                                data-1p-ignore="true"
                                data-lpignore="true"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                            >
                                {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                            </button>
                        </div>
                    </div>
                     {error && (
                        <p className="text-red-500 text-base text-center mb-4" role="alert">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#BF0A30] hover:bg-[#ab092a] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 text-xl"
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
