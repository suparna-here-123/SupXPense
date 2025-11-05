'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabaseClient'  // ✅ Client-side Supabase SDK

export default function RedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/') // Not logged in → go to sign-in page
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.push('/dashboard')  // Already has username → go to dashboard
      } else {
        router.push('/choose-username')  // New user → go to create username page
      }
    }

    handleRedirect()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-lg">Redirecting...</h2>
    </div>
  )
}
