

// hooks/useAccountsRealtime.ts
'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useAccountsRealtime(onUpdate: () => void) {
  const cbRef = useRef(onUpdate)
  
  // Keep ref current without re-subscribing
  useEffect(() => { cbRef.current = onUpdate }, [onUpdate])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('account_entries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_entries' },
        () => cbRef.current()   // always calls latest version
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])  // ← empty deps, subscribes only ONCE
}