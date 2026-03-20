import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Setup client direct here since the previous one was mocked/had missing methods or we don't know the state exactly
function createClient() {
    const cookieStore = cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    try { cookieStore.set({ name, value, ...options }) } catch {}
                },
                remove(name: string, options: any) {
                    try { cookieStore.delete({ name, ...options }) } catch {}
                },
            },
        }
    )
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient()
        
        // Check auth manually or rely on RLS depending on setup, but let's safely fetch
        const { searchParams } = new URL(request.url)
        const warehouse = searchParams.get('warehouse')
        
        let query = supabase
            .from('tracking_trips')
            .select('*')
            .order('created_at', { ascending: false })

        if (warehouse) {
            query = query.eq('warehouse', warehouse)
        }

        const { data, error } = await query

        if (error) {
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('GET /api/tracking error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient()
        const body = await request.json()

        // Remove mocked data that breaks Postgres UUID validation
        if (body.created_by === 'user-001' || !body.created_by) {
            delete body.created_by
        }
        
        // Remove tracking draft metadata
        delete body._localId
        delete body._saved
        delete body._isNew

        // Try getting actual authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            body.created_by = user.id
        }

        // Insert into Supabase table `tracking_trips`
        const { data, error } = await supabase
            .from('tracking_trips')
            .insert(body)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error('POST /api/tracking error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient()
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing row ID' }, { status: 400 })
        }

        if (updates.created_by === 'user-001') {
            delete updates.created_by
        }

        const { data, error } = await supabase
            .from('tracking_trips')
            .update({...updates, updated_at: new Date().toISOString()})
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('PUT /api/tracking error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        console.log('API: Attempting to delete trip with ID:', id)

        if (!id) {
            return NextResponse.json({ error: 'Missing row ID' }, { status: 400 })
        }

        const { error, count } = await supabase
            .from('tracking_trips')
            .delete({ count: 'exact' })
            .eq('id', id)

        if (error) {
            console.error('API: Supabase delete error:', error)
            throw error
        }

        console.log('API: Deletion successful, rows affected:', count)

        return NextResponse.json({ success: true, deletedCount: count })
    } catch (error: any) {
        console.error('DELETE /api/tracking error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
