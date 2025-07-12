'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabaseClient'

export default function RedirectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleRedirect = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/') // go back to sign-in
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.push('/dashboard')
      } else {
        router.push('/choose-username')
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
