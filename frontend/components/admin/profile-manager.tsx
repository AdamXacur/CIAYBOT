"use client"

import { useEffect, useState } from "react"

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
        const res = await fetch("http://localhost:8000/api/v1/analytics/profiles")
        setProfiles(await res.json())
      } catch (error) { console.error("Error fetching profiles:", error) } 
      finally { setLoading(false) }
    }
    fetchProfiles()
  }, [])

  return (
    <div className="space-y-6">
      {profiles.map((profile) => (
        <div key={profile.code} className="bg-slate-900 p-6 rounded-lg border border-guinda/30">
          <h3 className="text-xl font-bold text-dorado font-mono">{profile.code}</h3>
          <p className="text-gray-300 mt-2">{profile.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Ejemplos de Activación:</h4>
            <p className="text-sm text-gray-500 italic whitespace-pre-line">{profile.examples}</p>
          </div>
        </div>
      ))}
    </div>
  )
}