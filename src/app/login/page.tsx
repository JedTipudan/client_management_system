'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else if (data.user) {
      setMessage('Success! Redirecting...')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-white mb-8">Login</h1>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
            placeholder="Password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 text-white font-bold py-3 rounded-lg"
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/signup" className="text-cyan-400">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}