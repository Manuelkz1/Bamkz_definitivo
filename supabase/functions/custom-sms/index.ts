
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credenciales de Twilio
const TWILIO_ACCOUNT_SID = 'ACb9b0a238416a8748de4fa57aa971cb73';
const TWILIO_AUTH_TOKEN = '12e2361e40995b277b11dc49762420ac';
const TWILIO_VERIFY_SERVICE_SID = 'VA8ec51bf464d4a06c37494d45e1cdb9b1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { phone, action = 'send', code } = requestBody;
    
    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Formatear número de teléfono
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('57') && formattedPhone.length === 10) {
      formattedPhone = '57' + formattedPhone;
    }
    formattedPhone = '+' + formattedPhone;

    if (action === 'send') {
      // Enviar código de verificación
      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      
      const twilioResponse = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
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

      const twilioData = await twilioResponse.json();

      if (twilioResponse.ok) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Código enviado a ${formattedPhone.replace(/\d(?=\d{4})/g, '*')}`,
            status: twilioData.status,
            sid: twilioData.sid
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(twilioData.message || 'Error enviando SMS');
      }
    } else if (action === 'verify') {
      // Verificar código
      if (!code) {
        throw new Error('Verification code is required');
      }

      const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      
      const twilioResponse = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
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

      const twilioData = await twilioResponse.json();

      if (twilioResponse.ok && twilioData.status === 'approved') {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Código verificado correctamente',
            status: twilioData.status
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error(twilioData.message || 'Código incorrecto o expirado');
      }
    }

  } catch (error) {
    console.error('Error in SMS function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error procesando SMS',
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
