'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

export interface SystemSetting {
  key: string
  value: any
  description: string
  updated_at: string
}

export function useSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')

    if (error) {
        console.error('Error fetching settings:', error)
        setError(error.message)
    } else {
        setSettings(data as SystemSetting[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSetting = async (key: string, value: any) => {
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('system_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) {
      console.error(`Error updating setting ${key}:`, error)
      throw error
    } else {
      // Update local state optimizing the refetch
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s))
    }
  }

  const getSetting = <T, >(key: string, defaultValue: T): T => {
    const setting = settings.find(s => s.key === key)
    if (!setting) return defaultValue
    
    // Supabase jsonb usually parses automatically, but just in case:
    try {
        if (typeof setting.value === 'string') return JSON.parse(setting.value) as T
        return setting.value as T
    } catch {
        return setting.value as T
    }
  }

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    getSetting,
    fetchSettings
  }
}
