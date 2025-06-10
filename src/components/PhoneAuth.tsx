import React, { useState } from 'react';
import { Phone, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

interface PhoneAuthProps {
  onBack: () => void;
  onAuthSuccess?: () => void;
}

export function PhoneAuth({ onBack, onAuthSuccess }: PhoneAuthProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const { initialize, signInWithPhone } = useAuthStore();

  // Formatear número de teléfono mientras se escribe
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
    
    // Formato visual para Colombia: +57 XXX XXX XXXX
    let formatted = value;
    if (formatted.length > 0) {
      if (formatted.startsWith('57')) {
        formatted = formatted.substring(2);
      } else if (formatted.startsWith('0')) {
        formatted = formatted.substring(1);
      }
      
      if (formatted.length <= 3) {
        formatted = `+57 ${formatted}`;
      } else if (formatted.length <= 6) {
        formatted = `+57 ${formatted.slice(0, 3)} ${formatted.slice(3)}`;
      } else {
        formatted = `+57 ${formatted.slice(0, 3)} ${formatted.slice(3, 6)} ${formatted.slice(6, 10)}`;
      }
    }
    setFormattedPhone(formatted);
  };

  const sendSMSCode = async () => {
    if (!phone) {
      toast.error('Por favor ingresa tu número de teléfono');
      return;
    }

    if (phone.length < 10) {
      toast.error('Por favor ingresa un número válido de 10 dígitos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('custom-sms', {
        body: {
          phone: phone,
          action: 'send'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Código enviado a ${data.message.split(' ')[2]}`);
        setStep('code');
      } else {
        throw new Error(data.error || 'Error enviando código');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast.error(error.message || 'Error enviando código SMS');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length < 4) {
      toast.error('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await signInWithPhone(phone, code);

      if (error) {
        throw new Error(error.message || 'Error verificando código');
      }

      toast.success('¡Autenticación exitosa!');
      
      if (onAuthSuccess) {
        onAuthSuccess();
      }

    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Error verificando código');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center mb-6">
          <button
            onClick={onBack}
            className="absolute left-4 top-4 p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Phone className="h-12 w-12 text-indigo-600" />
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'phone' ? 'Ingresa tu teléfono' : 'Verifica tu código'}
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'phone' 
            ? 'Te enviaremos un código SMS para verificar tu número'
            : `Ingresa el código que enviamos a ${formattedPhone}`
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'phone' ? (
            <form onSubmit={(e) => { e.preventDefault(); sendSMSCode(); }}>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Número de teléfono
                </label>
                <div className="mt-1 relative">
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="3001234567"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                  />
                  {formattedPhone && (
                    <div className="mt-1 text-sm text-gray-500">
                      {formattedPhone}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Ingresa tu número de 10 dígitos sin el código de país
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Enviar código SMS'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código de verificación
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center text-lg font-mono"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Ingresa el código de 6 dígitos que recibiste por SMS
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="submit"
                  disabled={loading || code.length < 4}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Verificar código'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                  }}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Cambiar número de teléfono
                </button>

                <button
                  type="button"
                  onClick={sendSMSCode}
                  disabled={loading}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
