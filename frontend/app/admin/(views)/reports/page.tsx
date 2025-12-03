"use client"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"
import { MapPin, AlertTriangle } from "lucide-react"

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/analytics/reports`).then(res => res.json()).then(setReports).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
        {reports.map((rep) => (
            <div key={rep.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-red-200 transition-all">
                <div className="p-3 bg-red-50 text-red-500 rounded-lg">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">{rep.report_type}</h3>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">#{rep.ticket_id}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rep.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-ciay-brown font-medium">
                        <MapPin className="w-3 h-3" /> {rep.location}
                    </div>
                </div>
                <div className="md:text-right">
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                        {rep.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-2">{new Date(rep.created_at).toLocaleString()}</p>
                </div>
            </div>
        ))}
        {reports.length === 0 && <div className="text-center text-gray-400 p-10">No hay reportes ciudadanos.</div>}
    </div>
  )
}