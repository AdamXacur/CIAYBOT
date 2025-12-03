"use client"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/config"
import { GraduationCap, CheckCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CoursesPage() {
  const [regs, setRegs] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/analytics/registrations`).then(res => res.json()).then(setRegs).catch(console.error)
  }, [])

  const handleDelete = async (id: string) => {
      if (!confirm("¿Eliminar inscripción?")) return;
      
      try {
          const res = await fetch(`${API_BASE_URL}/api/v1/analytics/registrations/${id}`, { method: 'DELETE' })
          if (res.ok) {
              setRegs(prev => prev.filter(r => r.id !== id))
              toast({ title: "Inscripción eliminada", description: "El registro ha sido borrado." })
          }
      } catch (e) { console.error(e) }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
                <th className="p-4">Estudiante</th>
                <th className="p-4">Curso Solicitado</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-right">Acciones</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
            {regs.map((r) => (
                <tr key={r.id} className="hover:bg-ciay-cream/30 group">
                    <td className="p-4">
                        <div className="font-bold text-gray-800">{r.student_name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                    </td>
                    <td className="p-4">
                        <span className="flex items-center gap-2 font-medium text-ciay-brown">
                            <GraduationCap className="w-4 h-4" /> {r.course_name}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" /> {r.status}
                        </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                        <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
      {regs.length === 0 && <div className="text-center text-gray-400 p-10">No hay inscripciones registradas.</div>}
    </div>
  )
}