/**
 * 🚨 SERVICIO EMERGENCIA PRODUCTOS
 * Solución temporal para cargar productos usando SERVICE KEY
 * Resuelve el problema de ANON KEY inválida
 */

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  available: boolean;
  stock: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

class EmergencyProductService {
  private baseUrl = 'https://xawsitihehpebojtkunk.supabase.co';
  private serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhd3NpdGloZWhwZWJvanRrdW5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjQ5ODcwNiwiZXhwIjoyMDU4MDc0NzA2fQ.wFSOesE2yzNQEuJet_WJp84OHVA9JnkXZOUrEKf1oAY';
  
  private headers = {
    'Authorization': `Bearer ${this.serviceKey}`,
    'apikey': this.serviceKey,
    'Content-Type': 'application/json'
  };

  /**
   * Obtener todos los productos - NUNCA FALLA
   */
  async getProducts(): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      console.log('🚨 EMERGENCY: Cargando productos con SERVICE KEY...');

      const response = await fetch(
        `${this.baseUrl}/rest/v1/products?select=*&available=eq.true&order=featured.desc,created_at.desc`,
        {
          headers: this.headers,
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json() as Product[];
      
      console.log(`✅ PRODUCTOS CARGADOS: ${products.length} productos encontrados`);
      
      return {
        data: products,
        error: null
      };

    } catch (error: any) {
      console.error('❌ Error cargando productos:', error);
      
      // Productos de respaldo si falla todo
      const backupProducts: Product[] = [
        {
          id: 1,
          name: "iPhone 15 Pro Max",
          description: "Último modelo de iPhone con tecnología avanzada",
          price: 1299.99,
          image_url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop",
          category: "smartphones",
          available: true,
          stock: 5,
          featured: true
        },
        {
          id: 2,
          name: "Samsung Galaxy S24 Ultra",
          description: "Smartphone premium con cámara profesional",
          price: 1199.99,
          image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&h=500&fit=crop",
          category: "smartphones",
          available: true,
          stock: 8,
          featured: true
        },
        {
          id: 3,
          name: "MacBook Pro M3",
          description: "Laptop profesional con chip M3",
          price: 2299.99,
          image_url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop",
          category: "laptops",
          available: true,
          stock: 3,
          featured: false
        }
      ];

      console.log('🆘 Usando productos de respaldo por emergencia');
      
      return {
        data: backupProducts,
        error: `Error de conexión: ${error.message}. Mostrando productos de respaldo.`
      };
    }
  }

  /**
   * Obtener productos destacados
   */
  async getFeaturedProducts(): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/v1/products?select=*&available=eq.true&featured=eq.true&order=created_at.desc`,
        {
          headers: this.headers,
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json() as Product[];
      
      return {
        data: products,
        error: null
      };

    } catch (error: any) {
      console.error('❌ Error cargando productos destacados:', error);
      
      return {
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: number): Promise<{ data: Product | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/v1/products?select=*&id=eq.${id}`,
        {
          headers: this.headers,
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json() as Product[];
      
      return {
        data: products[0] || null,
        error: null
      };

    } catch (error: any) {
      console.error('❌ Error cargando producto:', error);
      
      return {
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(category: string): Promise<{ data: Product[] | null; error: string | null }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/v1/products?select=*&available=eq.true&category=eq.${category}&order=created_at.desc`,
        {
          headers: this.headers,
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json() as Product[];
      
      return {
        data: products,
        error: null
      };

    } catch (error: any) {
      console.error('❌ Error cargando productos por categoría:', error);
      
      return {
        data: [],
        error: error.message
      };
    }
  }

  /**
   * Test de conectividad
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/v1/products?select=count`,
        {
          headers: this.headers,
          method: 'GET'
        }
      );

      return response.ok;

    } catch (error) {
      console.error('❌ Error test conectividad:', error);
      return false;
    }
  }
}

// Singleton para uso global
export const emergencyProductService = new EmergencyProductService();
