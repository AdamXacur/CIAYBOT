"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Cpu } from "lucide-react"
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

const QUICK_SUGGESTIONS = ["¿Qué es el CIAY?", "Quiero invertir", "¿Hay becas?", "Programas disponibles"]

// URL HARDCODEADA PARA PRODUCCIÓN
const API_URL = "https://api.xac.lat/api/v1/chat";

export function ChatPanel() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "¡Bienvenido al **Centro de Inteligencia Artificial de Yucatán**! Soy tu asistente Neuro-Simbólico. ¿En qué puedo ayudarte hoy?",
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
      // USAMOS LA URL HARDCODEADA
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, session_id: sessionId }),
      })

      if (!response.body) throw new Error("No response body")

      const assistantId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true
        }
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
          
          setMessages((prev) => 
            prev.map((msg) => 
              msg.id === assistantId 
                ? { ...msg, content: accumulatedText } 
                : msg
            )
          )
        }
      }

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      )

    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Error de conexión con el flujo de datos.",
          timestamp: new Date(),
        }
      ])
      setIsLoading(false)
    }
  }

  const handleQuickSuggestion = (suggestion: string) => {
    setInput(suggestion)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-guinda/30 flex justify-between items-center">
        <h2 className="text-lg font-bold text-dorado uppercase tracking-wider flex items-center gap-2">
          <User className="w-5 h-5" />
          Interacción Ciudadana
        </h2>
        <span className="text-[10px] text-gray-500 font-mono">ID: {sessionId}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === "user" ? "bg-guinda text-white" : "bg-slate-700 text-gray-100 border border-dorado/20"
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === "assistant" && <Cpu className={`w-5 h-5 text-dorado flex-shrink-0 mt-0.5 ${message.isStreaming ? 'animate-pulse' : ''}`} />}
                <div className="flex-1 text-sm leading-relaxed">
                  <ReactMarkdown 
                    components={{
                      strong: ({node, ...props}) => <span className="font-bold text-dorado" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mt-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 bg-dorado ml-1 animate-pulse align-middle"></span>
                  )}

                  {!message.isStreaming && (
                    <p className="text-xs opacity-60 mt-2 border-t border-white/10 pt-1">
                      {message.timestamp.toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg px-4 py-3 border border-dorado/20">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-dorado animate-pulse" />
                <span className="text-xs text-gray-400">Conectando con Gemini...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-3 border-t border-guinda/30 bg-slate-800/30">
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleQuickSuggestion(suggestion)}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-guinda text-gray-300 hover:text-white rounded-full border border-guinda/30 hover:border-dorado transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-guinda/30 bg-slate-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-guinda/30 focus:border-dorado focus:outline-none focus:ring-2 focus:ring-dorado/20 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-guinda hover:bg-guinda/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold uppercase text-sm tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}