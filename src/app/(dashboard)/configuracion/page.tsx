'use client'

import { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, Loader2, ServerCog, Globe, Bell } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export default function ConfiguracionPage() {
  const { settings, isLoading, updateSetting, getSetting } = useSettings()
  const [savingKey, setSavingKey] = useState<string | null>(null)

  // Local states for inputs so they don't jump while typing
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({})

  // Initialize local state when settings change
  const handleLocalChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }))
  }

  const getValue = (key: string, defaultValue: any) => {
    if (localSettings[key] !== undefined) return localSettings[key]
    return getSetting(key, defaultValue)
  }

  const handleSave = async (key: string) => {
    if (localSettings[key] === undefined) return
    setSavingKey(key)
    try {
      await updateSetting(key, localSettings[key])
    } catch (e) {
      alert("Hubo un error al guardar: " + e)
    } finally {
      setSavingKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex bg-[#0f1117] min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00B4B4]" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 bg-[#0f1117] min-h-screen text-white">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,180,180,0.5)]">Configuración Global</h2>
          <p className="text-white/60">
            Administra los parámetros base de la plataforma. (Los cambios aquí afectan a todos los usuarios)
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#00B4B4]/20 data-[state=active]:text-[#00B4B4]">
            <ServerCog className="mr-2 h-4 w-4" />
            Parámetros Principales
          </TabsTrigger>
          <TabsTrigger value="dictionaries" className="data-[state=active]:bg-[#00B4B4]/20 data-[state=active]:text-[#00B4B4]">
            <Globe className="mr-2 h-4 w-4" />
            Diccionarios
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-[#00B4B4]/20 data-[state=active]:text-[#00B4B4]">
            <Bell className="mr-2 h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-white/5 border border-white/10 text-white backdrop-blur-xl">
            <CardHeader>
              <CardTitle>SLAs y Tiempos</CardTitle>
              <CardDescription className="text-white/50">
                 Define los tiempos límites para considerar un viaje atrasado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label htmlFor="sla_hours">SLA Tracker B2C (Horas)</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="sla_hours" 
                    type="number"
                    value={getValue('default_sla_hours', "48")} 
                    onChange={(e) => handleLocalChange('default_sla_hours', e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[#00B4B4]" 
                  />
                  <Button 
                    onClick={() => handleSave('default_sla_hours')}
                    disabled={savingKey === 'default_sla_hours'}
                    variant="outline" 
                    className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-emerald-500/20 whitespace-nowrap"
                  >
                    {savingKey === 'default_sla_hours' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dictionaries" className="space-y-4">
          <Card className="bg-white/5 border border-white/10 text-white backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Catálogos y Opciones</CardTitle>
              <CardDescription className="text-white/50">
                 Administra las opciones de las listas desplegables. (Ej: Agencias disponibles). Escribe separando por comas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transports">Agencias de Transporte B2B/B2C Permitidas</Label>
                <div className="flex gap-2">
                  <Input 
                    id="transports" 
                    value={getValue('allowed_transports', []).join?.(", ") || getValue('allowed_transports', [])} 
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      handleLocalChange('allowed_transports', arr)
                    }}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-[#00B4B4]" 
                    placeholder="OCASA, ANDREANI, TTE VILLA DEL SUR..."
                  />
                  <Button 
                    onClick={() => handleSave('allowed_transports')}
                    disabled={savingKey === 'allowed_transports'}
                    variant="outline" 
                    className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-emerald-500/20 whitespace-nowrap"
                  >
                    {savingKey === 'allowed_transports' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar
                  </Button>
                </div>
                <p className="text-xs text-white/40">Guarda la lista de opciones para que los usuarios las elijan al cargar un envío.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-white/5 border border-white/10 text-white backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Mantenimiento y Control</CardTitle>
              <CardDescription className="text-white/50">
                 Controles drásticos del comportamiento de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo Mantenimiento</Label>
                  <p className="text-sm text-white/50">
                    Muestra un cartel a todos los operativos notificando tareas de servidor.
                  </p>
                </div>
                <div>
                   <Switch 
                     checked={getValue('system_maintenance_mode', false) === true || getValue('system_maintenance_mode', false) === 'true'}
                     onCheckedChange={(checked) => {
                       handleLocalChange('system_maintenance_mode', checked)
                       updateSetting('system_maintenance_mode', checked)
                     }}
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
