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
      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-guinda/30 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-guinda/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-guinda">
            <ShieldCheck className="w-8 h-8 text-dorado" />
          </div>
          <h1 className="text-2xl font-bold text-white">Acceso Administrativo</h1>
          <p className="text-gray-400 text-sm mt-2">Sistema de Control CIAY</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-dorado focus:outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-dorado focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-guinda hover:bg-guinda/80 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}