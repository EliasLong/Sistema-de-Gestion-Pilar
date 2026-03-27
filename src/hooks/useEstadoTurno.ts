import { useState, useCallback } from 'react'
import { EstadoTurnoTrip, EstadoTurnoTripType } from '@/types/estado-turno'

const CHANNELS = [
    { id: '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM', sheet: 'PL2', type: 'B2C', cols: { fecha: 0, viaje: 3, bultos: 7, operario: 4, etiquetador: 10, transporte: 2, estado: 8 } },
    { id: '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI', sheet: 'PL2', type: 'B2B', cols: { fecha: 0, viaje: 5, bultos: 8, operario: 11, transporte: 2, estado: 13 } }
]

function isPatente(text: string): boolean {
    if (!text || text === '---' || text === 'FALSE') return false
    const val = text.toUpperCase().trim()
    const excluded = ['OCA', 'ANDREANI', 'CORREO', 'B2C', 'ENVIO', 'RETIRA', 'PL2', 'PICKUP', 'MOTOMENSAJERIA']
    if (excluded.some(word => val.includes(word))) return false
    return /^[A-Z]{3}\s?\d{3}$/.test(val) || /^[A-Z]{2}\s?\d{3}\s?[A-Z]{2}$/.test(val) || /^(?=.*[A-Z])(?=.*\d)[A-Z\d\s]{5,8}$/.test(val)
}

function parseDate(str: string): Date | null {
    if (!str || str.toUpperCase() === 'FALSE' || str === '---') return null
    let parts = str.trim().split(' ')[0].split('/')
    if (parts.length < 3) return null
    let d = parseInt(parts[0]), m = parseInt(parts[1]) - 1, y = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])
    return new Date(y, m, d)
}

// BOUNDARY: Data Migration Strategy
// When transitioning to Supabase DB, change `USE_LEGACY_SHEETS` to false 
// and implement `fetchFromDB`.
const USE_LEGACY_SHEETS = true

async function fetchFromSheets(): Promise<EstadoTurnoTrip[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tempMap = new Map<string, EstadoTurnoTrip>()

    // Parallelize network requests to cut waiting time by 50%
    const fetchPromises = CHANNELS.map(async (ch) => {
        const url = `https://docs.google.com/spreadsheets/d/${ch.id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(ch.sheet)}&t=${Date.now()}`
        try {
            const res = await fetch(url)
            const csv = await res.text()
            return { ch, csv }
        } catch(e) {
            console.error(`Failed to fetch channel ${ch.type}`, e)
            return { ch, csv: '' }
        }
    })

    const results = await Promise.all(fetchPromises)

    for (const { ch, csv } of results) {
        if (!csv) continue
        const rows = csv.split('\n').map(r => r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim()))

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const nViaje = row[ch.cols.viaje]
            const rowDate = parseDate(row[ch.cols.fecha])
            if (!nViaje || !rowDate) continue

            const transport = row[ch.cols.transporte] || ''
            const flotaPropia = ch.type === 'B2C' && isPatente(transport)
                        
            if (ch.type === 'B2C' && rowDate.getTime() !== today.getTime()) continue
            if (ch.type === 'B2B' && rowDate.getTime() < today.getTime()) continue

            const rawStatus = row[ch.cols.estado]?.toUpperCase() || ''
            const op = row[ch.cols.operario] || '---'
            const etiq = ch.cols.etiquetador !== undefined ? row[ch.cols.etiquetador] || '---' : '---'

            let status: 1|2|3|4|5 = 1
            if (rawStatus.includes('LIBERADO') || rawStatus.includes('ENTREGADO')) status = 5
            else if (rawStatus.includes('FAC') || rawStatus.includes('CERRADO')) {
                status = (ch.type === 'B2C' && (etiq === '' || etiq === '---')) ? 3 : 4
            } else if (rawStatus.includes('PICK') || (op !== '---' && op !== '')) {
                status = 2
            }

            tempMap.set(nViaje + ch.type, {
                id: nViaje,
                originalType: ch.type,
                type: flotaPropia ? 'FLOTA' : (ch.type as EstadoTurnoTripType),
                pkgs: parseInt(row[ch.cols.bultos]) || 0,
                op: (op === 'FALSE' || op === '') ? '---' : op,
                etiq: (etiq === 'FALSE' || etiq === '') ? '---' : etiq,
                carrier: transport,
                status,
                fecha: row[ch.cols.fecha]
            })
        }
    }
    return Array.from(tempMap.values())
}

async function fetchFromDB(): Promise<EstadoTurnoTrip[]> {
    // TODO: Implement Supabase fetch strategy here once backend is ready
    return []
}

export function useEstadoTurno() {
    const [trips, setTrips] = useState<EstadoTurnoTrip[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [lastSync, setLastSync] = useState<Date | null>(null)

    // SWR Initialization: Load cached trips from localStorage if any
    useState(() => {
        try {
            const cached = localStorage.getItem('estado_turno_cache')
            if (cached) {
                const parsed = JSON.parse(cached)
                setTrips(parsed)
            }
        } catch (e) {}
    })

    const syncAll = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = USE_LEGACY_SHEETS ? await fetchFromSheets() : await fetchFromDB()
            setTrips(data)
            setLastSync(new Date())
            try {
                localStorage.setItem('estado_turno_cache', JSON.stringify(data))
            } catch (e) {}
        } catch (error) {
            console.error("Error fetching turnos:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    return { trips, isLoading, lastSync, syncAll }
}
