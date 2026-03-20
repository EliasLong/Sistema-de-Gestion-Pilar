import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const warehouse = searchParams.get('warehouse')?.toUpperCase()
        
        const SHEET_ID = '1QwWUe34Yn0BnTfb8WckxzDRmEKJfuATPse9g76VM3n8'
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`
        
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch sheet')
        
        const csvText = await res.text()
        const rows = csvText.split('\n').map(line => {
            // Simple CSV parser for quoted strings (to handle commas in client names)
            const result = []
            let start = 0
            let inQuotes = false
            for (let i = 0; i < line.length; i++) {
                if (line[i] === '"') inQuotes = !inQuotes
                if (line[i] === ',' && !inQuotes) {
                    result.push(line.slice(start, i).replace(/^"|"$/g, '').trim())
                    start = i + 1
                }
            }
            result.push(line.slice(start).replace(/^"|"$/g, '').trim())
            return result
        })

        // Remove header
        const header = rows[0]
        const dataRows = rows.slice(1)

        // Calculate "last 48 hours" date
        const last48h = new Date()
        last48h.setHours(last48h.getHours() - 48)
        
        const mapped = dataRows
            .map(row => {
                const deposito = row[9]?.toUpperCase()
                if (warehouse && deposito !== warehouse) return null
                if (!row[12]) return null // No trip number

                let formattedDate = new Date().toISOString().split('T')[0]
                if (row[0]) {
                    const dateStr = String(row[0]).trim()
                    const parts = dateStr.split(/[\/\-]/)
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
                        } else {
                            // Assuming DD-MM-YYYY
                            formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                        }
                    }
                }

                const tripDate = new Date(formattedDate + 'T12:00:00')

                // Filter last 48 hours
                if (tripDate < last48h) {
                    return null
                }

                // Classification: B2B vs B2C
                const clientName = row[14] || ''
                const isB2C = clientName.toUpperCase().includes('B2C')
                const tripType = isB2C ? 'b2c' : 'b2b'

                // Specific mapping:
                // For B2C: carrier="Flota Propia", retira=row[1], vehicle_plate=row[2] (Patente)
                // For B2B: carrier=row[1], retira=row[1], vehicle_plate=row[2]
                const carrier = isB2C ? 'Flota Propia' : row[1]
                const retira = row[1]
                const vehicle_plate = row[2]

                return {
                    date: formattedDate,
                    carrier,
                    retira,
                    vehicle_plate,
                    trip_number: row[12],
                    client: clientName,
                    client_shift: row[8],
                    task_count: row[7] || '0',
                    port: row[13],
                    pallets: row[5] || '0',
                    comments: row[16] || '',
                    warehouse: deposito,
                    trip_type: tripType
                }
            })
            .filter(row => row !== null)

        return NextResponse.json(mapped)
    } catch (error: any) {
        console.error('API Sheet Import Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
