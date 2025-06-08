// SOLUCIÓN SIMPLE Y DIRECTA TWILIO SMS
// Elimina completamente el error "Failed to fetch"
// NO usa Edge Functions ni APIs complejas

interface SMSResult {
  success: boolean;
  message: string;
}

// Credenciales Twilio del usuario
const TWILIO_ACCOUNT_SID = 'ACb9b0a238416a8748de4fa57aa971cb73';
const TWILIO_AUTH_TOKEN = '12e2361e40995b277b11dc49762420ac';
const TWILIO_FROM_NUMBER = '+15705325844'; // Número verificado disponible

class SimpleTwilioSMS {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private verificationCodes: Map<string, { code: string; timestamp: number }>;

  constructor() {
    this.accountSid = TWILIO_ACCOUNT_SID;
    this.authToken = TWILIO_AUTH_TOKEN;
    this.fromNumber = TWILIO_FROM_NUMBER;
    this.verificationCodes = new Map();
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Limpiar y formatear número
    let cleaned = phoneNumber.replace(/[^\d]/g, '');
    
    // Remover cero inicial si existe
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Agregar código de país Colombia si no lo tiene
    if (!cleaned.startsWith('57') && cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    
    return '+' + cleaned;
  }

  private generateVerificationCode(): string {
    // Generar código de 6 dígitos
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private createAuth(): string {
    // Crear autenticación básica para Twilio
    return btoa(`${this.accountSid}:${this.authToken}`);
  }

  async sendVerificationCode(phoneNumber: string): Promise<SMSResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const verificationCode = this.generateVerificationCode();
      const auth = this.createAuth();

      console.log('📱 Enviando SMS a:', formattedPhone);

      // Guardar código para verificación posterior
      this.verificationCodes.set(formattedPhone, {
        code: verificationCode,
        timestamp: Date.now()
      });

      // Enviar SMS usando Twilio Messages API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.fromNumber,
            To: formattedPhone,
            Body: `🔐 Tu código de verificación BAMKZ es: ${verificationCode}\n\nEste código expira en 10 minutos.\n\n¡No compartas este código con nadie!`
          })
        }
      );

      const data = await response.json();
      console.log('📤 Respuesta Twilio:', data);

      if (response.ok && data.sid) {
        return {
          success: true,
          message: `Código enviado exitosamente a ${this.maskPhoneNumber(formattedPhone)}`
        };
      } else {
        // Manejar errores específicos de Twilio
        const errorMessage = this.getTwilioErrorMessage(data.code, data.message);
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error: any) {
      console.error('❌ Error enviando SMS:', error);
      return {
        success: false,
        message: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.'
      };
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<SMSResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const storedData = this.verificationCodes.get(formattedPhone);

      if (!storedData) {
        return {
          success: false,
          message: 'No se encontró código de verificación. Solicita uno nuevo.'
        };
      }

      // Verificar expiración (10 minutos)
      const tenMinutes = 10 * 60 * 1000;
      if (Date.now() - storedData.timestamp > tenMinutes) {
        this.verificationCodes.delete(formattedPhone);
        return {
          success: false,
          message: 'El código ha expirado. Solicita uno nuevo.'
        };
      }

      // Verificar código
      if (storedData.code === code) {
        this.verificationCodes.delete(formattedPhone);
        return {
          success: true,
          message: '✅ Código verificado correctamente'
        };
      } else {
        return {
          success: false,
          message: 'Código incorrecto. Verifica e inténtalo de nuevo.'
        };
      }
    } catch (error: any) {
      console.error('❌ Error verificando código:', error);
      return {
        success: false,
        message: 'Error al verificar código. Inténtalo de nuevo.'
      };
    }
  }

  private maskPhoneNumber(phoneNumber: string): string {
    // Enmascarar número para mostrar en UI
    const cleaned = phoneNumber.replace(/[^\d]/g, '');
    if (cleaned.length >= 10) {
      const lastFour = cleaned.slice(-4);
      const stars = '*'.repeat(cleaned.length - 4);
      return `+${stars}${lastFour}`;
    }
    return phoneNumber;
  }

  private getTwilioErrorMessage(code: number, message: string): string {
    // Mensajes de error específicos para códigos comunes de Twilio
    switch (code) {
      case 21608:
        return 'Número no verificado en cuenta trial. Agrega el número en console.twilio.com';
      case 21211:
        return 'Número de teléfono inválido';
      case 21614:
        return 'Número bloqueado o no válido para SMS';
      case 21408:
        return 'No tienes permisos para enviar a este destino';
      case 20003:
        return 'Error de autenticación con Twilio';
      default:
        return message || 'Error desconocido enviando SMS';
    }
  }

  // Método de prueba para verificar configuración
  async testConfiguration(): Promise<SMSResult> {
    try {
      const auth = this.createAuth();
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: '✅ Configuración Twilio válida'
        };
      } else {
        return {
          success: false,
          message: '❌ Credenciales Twilio inválidas'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: '❌ Error probando configuración'
      };
    }
  }
}

export const simpleTwilioSMS = new SimpleTwilioSMS();
