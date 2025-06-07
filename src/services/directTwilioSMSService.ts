// Servicio SMS directo con Twilio - Sin dependencia de Edge Functions
// Solución funcional inmediata para resolver "Failed to fetch"

// Credenciales Twilio (en producción usar variables de entorno)
const TWILIO_ACCOUNT_SID = 'ACb9b0a238416a8748de4fa57aa971cb73';
const TWILIO_AUTH_TOKEN = '12e2361e40995b277b11dc49762420ac';
const TWILIO_VERIFY_SERVICE_SID = 'VA8ec51bf464d4a06c37494d45e1cdb9b1';

export class DirectTwilioSMSService {
  private accountSid: string;
  private authToken: string;
  private verifyServiceSid: string;

  constructor() {
    this.accountSid = TWILIO_ACCOUNT_SID;
    this.authToken = TWILIO_AUTH_TOKEN;
    this.verifyServiceSid = TWILIO_VERIFY_SERVICE_SID;
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Formatear número de teléfono para Colombia
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('57') && cleaned.length === 10) {
      cleaned = '57' + cleaned;
    }
    
    return '+' + cleaned;
  }

  private createBasicAuth(): string {
    // Crear credenciales de autenticación básica
    return btoa(`${this.accountSid}:${this.authToken}`);
  }

  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const credentials = this.createBasicAuth();

      console.log('Enviando SMS a:', formattedPhone);

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            Channel: 'sms'
          })
        }
      );

      const data = await response.json();
      console.log('Respuesta Twilio:', data);

      if (response.ok && data.status === 'pending') {
        return {
          success: true,
          message: `Código enviado a ${formattedPhone.replace(/[0-9](?=[0-9]{4})/g, '*')}`
        };
      } else {
        // Manejar errores específicos de Twilio
        if (data.code === 21608) {
          return {
            success: false,
            message: 'Número no verificado en cuenta trial. Verifícalo en console.twilio.com'
          };
        }
        return {
          success: false,
          message: data.message || 'Error enviando SMS'
        };
      }
    } catch (error: any) {
      console.error('Error enviando SMS:', error);
      return {
        success: false,
        message: 'Error de conexión con Twilio'
      };
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const credentials = this.createBasicAuth();

      console.log('Verificando código para:', formattedPhone);

      const response = await fetch(
        `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            Code: code
          })
        }
      );

      const data = await response.json();
      console.log('Respuesta verificación:', data);

      if (response.ok && data.status === 'approved') {
        return {
          success: true,
          message: 'Código verificado correctamente'
        };
      } else {
        return {
          success: false,
          message: data.message || 'Código incorrecto o expirado'
        };
      }
    } catch (error: any) {
      console.error('Error verificando código:', error);
      return {
        success: false,
        message: 'Error de conexión con Twilio'
      };
    }
  }

  // Método para validar configuración
  async testConfiguration(): Promise<{ success: boolean; message: string }> {
    try {
      const credentials = this.createBasicAuth();
      
      // Verificar credenciales con API de Twilio
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: 'Configuración Twilio válida'
        };
      } else {
        return {
          success: false,
          message: 'Credenciales Twilio inválidas'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Error probando configuración'
      };
    }
  }
}

export const directTwilioSMSService = new DirectTwilioSMSService();
