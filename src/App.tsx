// React JSX transform automático habilitado - no se requiere import explícito
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🛍️ Bamkz
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Tienda Online Premium
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <p className="text-green-600 font-semibold">
            ✅ Aplicación funcionando correctamente
          </p>
          <p className="text-gray-500 mt-2">
            React SPA con PWA habilitado
          </p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
