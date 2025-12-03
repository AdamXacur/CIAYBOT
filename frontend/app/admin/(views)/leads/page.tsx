"use client"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"
import { Briefcase, Mail, Phone, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/analytics/leads`).then(res => res.json()).then(setLeads).catch(console.error)
  }, [])

  const handleDelete = async (id: string) => {
      if (!confirm("¿Estás seguro de eliminar este lead?")) return;
      
      try {
          const res = await fetch(`${API_BASE_URL}/api/v1/analytics/leads/${id}`, { method: 'DELETE' })
          if (res.ok) {
              setLeads(prev => prev.filter(l => l.id !== id))
              toast({ title: "Lead eliminado", description: "El registro ha sido borrado correctamente." })
          }
      } catch (e) {
          console.error(e)
      }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:border-ciay-gold transition-all group relative">
            
            <button 
                onClick={() => handleDelete(lead.id)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Eliminar Lead"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start mb-4 pr-8">
                <div>
                    <h3 className="font-bold text-ciay-brown text-lg">{lead.nombre}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase">{lead.empresa || "Particular"}</p>
                </div>
            </div>
            <div className="mb-3">
                <span className="px-2 py-1 bg-ciay-cream text-ciay-brown text-xs font-bold rounded border border-ciay-brown/20">
                    {lead.interes || "General"}
                </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-ciay-gold" /> {lead.correo}</div>
                {lead.telefono && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-ciay-gold" /> {lead.telefono}</div>}
            </div>
            {lead.mensaje && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500 italic border-l-2 border-ciay-silver">
                    "{lead.mensaje}"
                </div>
            )}
            <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-right">
                Registrado: {new Date(lead.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {leads.length === 0 && <div className="text-center text-gray-400 p-10">No hay leads registrados aún.</div>}
    </div>
  )
}