"use client"

import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"

interface Profile {
  code: string
  description: string
  examples: string
}

export function ProfileManager() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // --- FIX: USAR URL REAL ---
        const res = await fetch(`${API_BASE_URL}/api/v1/analytics/profiles`)
        if (res.ok) setProfiles(await res.json())
      } catch (error) { console.error("Error fetching profiles:", error) } 
      finally { setLoading(false) }
    }
    fetchProfiles()
  }, [])

  return (
    <div className="space-y-6">
      {profiles.map((profile) => (
        <div key={profile.code} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-ciay-gold transition-all">
          <h3 className="text-xl font-bold text-ciay-brown font-mono flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-ciay-gold"></span>
              {profile.code}
          </h3>
          <p className="text-gray-600 mt-2">{profile.description}</p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Ejemplos de Activación:</h4>
            <p className="text-sm text-gray-500 italic whitespace-pre-line bg-gray-50 p-3 rounded border border-gray-100">
                {profile.examples}
            </p>
          </div>
        </div>
      ))}
      {profiles.length === 0 && !loading && (
          <div className="text-center p-10 text-gray-400">No se encontraron perfiles en la taxonomía.</div>
      )}
    </div>
  )
}