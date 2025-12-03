"use client"

import { useRouter, usePathname } from "next/navigation"
import { 
    LayoutDashboard, 
    ShieldAlert, 
    BarChart3, 
    Users, 
    LogOut, 
    Server,
    Database,
    Briefcase,
    GraduationCap,
    Megaphone
} from "lucide-react"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const logout = () => {
    localStorage.removeItem("token")
    router.push("/admin/login")
  }

  const menuItems = [
    { href: "/admin/dashboard", label: "Vista General", icon: LayoutDashboard },
    { href: "/admin/intelligence", label: "Business Intelligence", icon: BarChart3 },
    { href: "/admin/audit", label: "Auditoría Forense", icon: ShieldAlert },
    { href: "/admin/profiles", label: "Gestión de Perfiles", icon: Users },
  ]

  // Nuevos Módulos Operativos
  const opsItems = [
    { href: "/admin/leads", label: "CRM Leads", icon: Briefcase },
    { href: "/admin/courses", label: "Academia", icon: GraduationCap },
    { href: "/admin/reports", label: "Reportes Ciudadanos", icon: Megaphone },
  ]

  if (pathname === "/admin/login") return <>{children}</>

  return (
    <div className="min-h-screen bg-ciay-cream flex font-sans">
      <aside className="w-64 bg-ciay-brown text-white flex flex-col shadow-2xl z-20 border-r border-ciay-gold/20">
        <div className="p-6 border-b border-white/10">
           <h1 className="text-xl font-bold tracking-widest text-white">CIAY <span className="text-ciay-gold">ADMIN</span></h1>
           <p className="text-[10px] text-ciay-silver mt-1 uppercase">Control Center v1.0</p>
        </div>

        <nav className="flex-1 py-6 space-y-6 px-3 overflow-y-auto custom-scrollbar">
           {/* Módulos Analíticos */}
           <div>
               <p className="px-3 text-[10px] font-bold text-ciay-gold/70 uppercase mb-2 tracking-wider">Analítica</p>
               {menuItems.map((item) => {
                 const Icon = item.icon
                 const isActive = pathname === item.href
                 return (
                   <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white border-l-4 border-ciay-gold shadow-inner" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                     <Icon className={`w-5 h-5 ${isActive ? "text-ciay-gold" : "text-gray-400"}`} />
                     {item.label}
                   </Link>
                 )
               })}
           </div>

           {/* Módulos Operativos (NUEVO) */}
           <div>
               <p className="px-3 text-[10px] font-bold text-ciay-gold/70 uppercase mb-2 tracking-wider">Operación</p>
               {opsItems.map((item) => {
                 const Icon = item.icon
                 const isActive = pathname === item.href
                 return (
                   <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-white/10 text-white border-l-4 border-ciay-gold shadow-inner" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}>
                     <Icon className={`w-5 h-5 ${isActive ? "text-ciay-gold" : "text-gray-400"}`} />
                     {item.label}
                   </Link>
                 )
               })}
           </div>

           <div>
             <p className="px-3 text-[10px] font-bold text-ciay-gold/70 uppercase mb-2 tracking-wider">Infraestructura</p>
             <div className="px-3 py-2 text-xs text-gray-300 flex items-center gap-2"><Server className="w-4 h-4 text-green-400" /> AWS EC2 (Online)</div>
             <div className="px-3 py-2 text-xs text-gray-300 flex items-center gap-2"><Database className="w-4 h-4 text-green-400" /> Postgres RDS (Stable)</div>
           </div>
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
            <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white w-full transition-colors"><LogOut className="w-4 h-4" /> Cerrar Sesión</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-ciay-brown/10 h-16 flex items-center justify-between px-8 shadow-sm">
            <h2 className="text-lg font-bold text-ciay-brown uppercase tracking-wide">
                {[...menuItems, ...opsItems].find(i => i.href === pathname)?.label || "Dashboard"}
            </h2>
            <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> SISTEMA OPERATIVO
                </span>
                <div className="w-8 h-8 rounded-full bg-ciay-brown text-white flex items-center justify-center font-bold text-xs border-2 border-ciay-gold">AD</div>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-ciay-cream/50">
            {children}
        </main>
      </div>
    </div>
  )
}