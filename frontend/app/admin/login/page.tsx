"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, ShieldCheck } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)

    try {
      const res = await fetch("https://api.xac.lat/api/v1/auth/login", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Credenciales inválidas")

      const data = await res.json()
      localStorage.setItem("token", data.access_token)
      router.push("/admin/dashboard")
    } catch (err) {
      setError("Acceso denegado. Verifique sus credenciales.")
    }
  }

  return (
    // FONDO CREMA
    <div className="min-h-screen bg-ciay-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-ciay-brown/20 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ciay-brown/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-ciay-brown">
            <ShieldCheck className="w-8 h-8 text-ciay-brown" />
          </div>
          <h1 className="text-2xl font-bold text-ciay-brown">Acceso Administrativo</h1>
          <p className="text-ciay-slate text-sm mt-2">Sistema de Control CIAY</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-ciay-slate uppercase mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-ciay-gold focus:outline-none focus:ring-1 focus:ring-ciay-gold/50"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ciay-slate uppercase mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:border-ciay-gold focus:outline-none focus:ring-1 focus:ring-ciay-gold/50"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-ciay-brown hover:bg-ciay-brown/90 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-ciay-brown/20"
          >
            <Lock className="w-4 h-4" />
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}