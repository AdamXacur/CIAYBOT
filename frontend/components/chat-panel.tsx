"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { API_BASE_URL } from "@/lib/config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

// --- SUGERENCIAS ESTRATÉGICAS (DETONADORES DE TOOLS) ---
const QUICK_SUGGESTIONS = [
  "Me interesa invertir capital",      // -> Tool: save_contact
  "Quiero inscribirme a un curso",     // -> Tool: register_course
  "Reportar un fallo urbano",          // -> Tool: create_report
  "¿Qué es el CIAY?"                   // -> Info General
]

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hola. Soy el asistente oficial del **CIAY**. Estoy conectado a la infraestructura de AWS para brindarte información precisa sobre tecnología, inversión y gobierno en Yucatán.",
      timestamp: new Date(),
      isStreaming: false
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, session_id: sessionId }),
      })

      if (!response.body) throw new Error("No response body")

      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true }
      ])
      
      setIsLoading(false)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let accumulatedText = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk
          setMessages((prev) => prev.map((msg) => msg.id === assistantId ? { ...msg, content: accumulatedText } : msg))
        }
      }
      setMessages((prev) => prev.map((msg) => msg.id === assistantId ? { ...msg, isStreaming: false } : msg))

    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "Error de conexión.", timestamp: new Date() }])
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${
                message.role === "user" 
                ? "bg-ciay-brown text-white rounded-br-none"
                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-ciay-gold/10 flex items-center justify-center flex-shrink-0">
                     <Sparkles className="w-4 h-4 text-ciay-brown" />
                  </div>
                )}
                <div className="flex-1 text-sm leading-7">
                  <ReactMarkdown 
                    components={{
                      strong: ({node, ...props}) => <span className={`font-bold ${message.role === 'user' ? 'text-ciay-gold' : 'text-ciay-brown'}`} {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setInput(s)} className="px-3 py-1 text-xs font-medium text-ciay-slate bg-ciay-cream hover:bg-ciay-brown hover:text-white rounded-full transition-colors border border-ciay-brown/10">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Escribe tu consulta aquí..."
            className="flex-1 bg-gray-50 text-gray-900 px-5 py-4 rounded-xl border border-gray-200 focus:border-ciay-brown focus:ring-1 focus:ring-ciay-brown outline-none shadow-inner transition-all placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-ciay-brown hover:bg-ciay-brown/90 text-white px-8 py-4 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-ciay-brown/20 hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-3">
             <p className="text-[10px] text-gray-400">Protegido por AWS Shield. La IA puede cometer errores.</p>
        </div>
      </div>
    </div>
  )
}