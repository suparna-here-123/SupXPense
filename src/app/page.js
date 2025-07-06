'use client'

import supabase from '@/utils/supabaseClient'
export default function LoginPage() {
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // redirectTo: 'https://sup-x-pense.vercel.app/choose-username'
        redirectTo: 'http://localhost:3000/choose-username'
      }
    })

    if (error) {
      console.error('Login error:', error.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Sign in with Google
      </button>
    </div>
  )
}
