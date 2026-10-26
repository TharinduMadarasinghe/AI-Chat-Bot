import { useState, useRef, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`
// Sends the whole conversation so the bot remembers earlier messages
async function getBotReply(history) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: history.map((msg) => ({
        role: msg.type === 'user-message' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
    }),
  })

  if (!response.ok) {
  const err = await response.json().catch(() => null)
  console.error('Gemini error:', err)
  throw new Error(err?.error?.message || `API request failed (${response.status})`)
}

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function addMessage(text, type) {
    setMessages((prev) => [...prev, { text, type }])
  }

  const handleSend = async () => {
    const message = input.trim()
    if (message === '' || loading) return

    const userMsg = { text: message, type: 'user-message' }
    addMessage(message, 'user-message')
    setInput('')
    setLoading(true)

    try {
      const reply = await getBotReply([...messages, userMsg])
      addMessage(reply, 'bot-message')
    } catch (error) {
      console.error(error)
      addMessage('Sorry, something went wrong. Please try again.', 'bot-message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex justify-center pt-20 p-5 bg-gradient-to-r from-blue-950 to-blue-500">
      <div className="w-[45%] min-w-80 h-[600px] bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl flex flex-col overflow-hidden">
        <header className="text-3xl font-bold text-white text-center py-4 bg-white/10">
          Ai Chatbot 🤖
        </header>

        <div id="chat-box" className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={
                msg.type === 'user-message'
                  ? 'self-end bg-blue-600 text-white rounded-xl px-3 py-2 max-w-[80%] whitespace-pre-wrap'
                  : 'self-start bg-gray-100 text-gray-700 rounded-xl px-3 py-2 max-w-[80%] whitespace-pre-wrap'
              }
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="self-start bg-gray-100 text-gray-500 rounded-xl px-3 py-2">
              Typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 p-2 bg-white/10">
          <input
            id="user-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="bg-white flex-1 rounded-xl px-3 h-9 text-sm outline-none"
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg w-20 h-9 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default App