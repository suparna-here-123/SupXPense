'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabaseClient'

export default function ChooseUsername() {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not logged in.')
      return
    }
    const { error: insertError } = await supabase.from('users').insert({
      id: user.id,
      username: username.trim(),
      firstname : firstName,
      lastname : lastName
    })

    if (insertError) {
      setError('Username already taken or error saving.')
      return
    }

    // Success → Go to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-6">Create a profile</h1>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 w-full max-w-sm mb-4 rounded"
        placeholder="Your username e.g. suppra123"
      />
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="border p-2 w-full max-w-sm mb-4 rounded"
        placeholder="How to find you by first name? e.g. Suparna"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="border p-2 w-full max-w-sm mb-4 rounded"
        placeholder="How to find you by last name? e.g. Prasad"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}
