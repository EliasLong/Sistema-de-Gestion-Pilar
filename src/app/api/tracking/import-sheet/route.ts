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

        // Calculate "last month onwards" date
        const now = new Date()
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        
        const mapped = dataRows
            .map(row => {
                const deposito = row[9]?.toUpperCase()
                if (warehouse && deposito !== warehouse) return null
                if (!row[12]) return null // No trip number

                let tripDate: Date | null = null
                let formattedDate = new Date().toISOString().split('T')[0]
                if (row[0]) {
                    const parts = row[0].split('/')
                    if (parts.length === 3) {
                        formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
                        tripDate = new Date(formattedDate)
                    }
                }

                // Date filtering: skip if trip is older than start of last month
                if (tripDate && tripDate < lastMonth) {
                    return null
                }

                // Classification: B2B vs B2C
                const clientName = row[14] || ''
                const tripType = clientName.toUpperCase().includes('B2C') ? 'b2c' : 'b2b'

                return {
                    date: formattedDate,
                    carrier: row[1],
                    vehicle_plate: row[3],
                    trip_number: row[12],
                    client: clientName,
                    client_shift: row[15],
                    task_count: row[5] || '0',
                    port: row[17],
                    pallets: row[6] || '0',
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
