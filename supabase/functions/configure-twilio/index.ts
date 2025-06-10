
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Configurar variables de entorno de Twilio
    Deno.env.set('TWILIO_ACCOUNT_SID', 'ACb9b0a238416a8748de4fa57aa971cb73');
    Deno.env.set('TWILIO_AUTH_TOKEN', '12e2361e40995b277b11dc49762420ac');
    Deno.env.set('TWILIO_VERIFY_SERVICE_SID', 'VA8ec51bf464d4a06c37494d45e1cdb9b1');
    
    // Configurar para Supabase Auth
    Deno.env.set('SUPABASE_AUTH_SMS_PROVIDER', 'twilio');
    Deno.env.set('SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID', 'ACb9b0a238416a8748de4fa57aa971cb73');
    Deno.env.set('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN', '12e2361e40995b277b11dc49762420ac');
    Deno.env.set('SUPABASE_AUTH_SMS_TWILIO_VERIFY_SERVICE_SID', 'VA8ec51bf464d4a06c37494d45e1cdb9b1');
    
    const result = {
      success: true,
      message: 'Twilio configuration set',
      timestamp: new Date().toISOString(),
      config: {
        account_sid: 'ACb9b0a238416a8748de4fa57aa971cb73',
        verify_service_sid: 'VA8ec51bf464d4a06c37494d45e1cdb9b1',
        provider: 'twilio'
      }
    };
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
