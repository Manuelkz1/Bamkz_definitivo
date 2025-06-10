// Utilidades de seguridad y validación

// Sanitizar input del usuario
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remover caracteres peligrosos
    .trim()
    .slice(0, 1000); // Limitar longitud
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 320;
}

// Validar teléfono colombiano
export function isValidColombianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  // Formato: 10 dígitos o 12 dígitos con código de país (57)
  return /^(57)?[3][0-9]{9}$/.test(cleanPhone) || /^[3][0-9]{9}$/.test(cleanPhone);
}

// Validar URL
export function isValidURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Validar y formatear precio
export function sanitizePrice(price: string | number): number {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return Math.max(0, Math.min(999999999, numPrice || 0));
}

// Validar cantidad
export function sanitizeQuantity(quantity: string | number): number {
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  return Math.max(1, Math.min(100, numQuantity || 1));
}

// Rate limiting básico por IP/usuario
class RateLimiter {
  private requests = new Map<string, number[]>();
  
  isAllowed(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key)!;
    
    // Limpiar requests viejos
    const validRequests = requests.filter(time => time > windowStart);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Verificar fortaleza de contraseña
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  if (password.length < 8) {
    issues.push('La contraseña debe tener al menos 8 caracteres');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  if (!/[a-z]/.test(password)) {
    issues.push('Debe incluir al menos una letra minúscula');
  } else {
    score += 1;
  }
  
  if (!/[A-Z]/.test(password)) {
    issues.push('Debe incluir al menos una letra mayúscula');
  } else {
    score += 1;
  }
  
  if (!/\d/.test(password)) {
    issues.push('Debe incluir al menos un número');
  } else {
    score += 1;
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('Debe incluir al menos un carácter especial');
  } else {
    score += 1;
  }
  
  // Verificar patrones comunes débiles
  const weakPatterns = [
    /123/,
    /abc/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /colombia/i
  ];
  
  if (weakPatterns.some(pattern => pattern.test(password))) {
    issues.push('Evita patrones comunes o palabras obvias');
    score = Math.max(0, score - 2);
  }
  
  return {
    isValid: issues.length === 0 && score >= 4,
    score: Math.min(5, score),
    issues
  };
}

// Generar token seguro
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

// Encriptar datos sensibles (básico)
export function obfuscateData(data: string): string {
  if (data.length <= 4) return data;
  
  const start = data.slice(0, 2);
  const end = data.slice(-2);
  const middle = '*'.repeat(Math.max(1, data.length - 4));
  
  return start + middle + end;
}

// Limpiar datos del localStorage de manera segura
export function secureLocalStorageClear(): void {
  try {
    // Limpiar datos sensibles específicos
    const sensitiveKeys = [
      'supabase.auth.token',
      'payment_data',
      'user_session',
      'temp_password'
    ];
    
    sensitiveKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Verificar y limpiar claves que contengan términos sensibles
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('password') || key.includes('token') || key.includes('auth'))) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Headers de seguridad para requests
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  };
}

// Validar y sanitizar datos de formulario
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = isFinite(value) ? value : 0;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      ).slice(0, 100); // Limitar arrays
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Detectar y prevenir ataques de inyección básicos
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /document\./gi,
    /window\./gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

// Logging seguro (sin datos sensibles)
export function secureLog(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    // Solo incluir datos no sensibles
    data: data ? sanitizeLogData(data) : undefined
  };
  
  console[level](`[${timestamp}] ${message}`, logEntry.data);
}

function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    return data.length > 100 ? data.slice(0, 100) + '...' : data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}
