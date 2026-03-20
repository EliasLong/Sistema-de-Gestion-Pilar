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
        
        const showDeleted = searchParams.get('showDeleted') === 'true'
        
        let query = supabase
            .from('tracking_trips')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (warehouse) {
            query = query.eq('warehouse', warehouse)
        }

        if (!showDeleted) {
            query = query.neq('status', 'deleted')
        } else {
            query = query.eq('status', 'deleted')
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
        const isPermanent = searchParams.get('permanent') === 'true'
        const warehouse = searchParams.get('warehouse')

        console.log(`API: Attempting to ${isPermanent ? 'PERMANENTLY' : 'SOFT'} delete trip with ID:`, id)

        if (!id) {
            return NextResponse.json({ error: 'Missing row ID' }, { status: 400 })
        }

        let result;
        if (isPermanent) {
            // Check for admin role before permanent delete
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            
            if (authError || !user) {
                console.error('API: Auth error or user not found:', authError)
                return NextResponse.json({ error: 'Auth failed: ' + (authError?.message || 'No user') }, { status: 401 })
            }

            console.log('API: User authenticated for delete:', user.email)

            const { data: profile, error: profileError } = await supabase.from('users').select('role').eq('id', user.id).single()
            
            if (profileError) {
                console.error('API: Profile fetch error:', profileError)
                // If profile not found, maybe check if email is admin. 
                // Alternatively, if the user requested it, we can be more flexible here for debugging.
            }

            console.log('API: User role:', profile?.role)

            if (profile?.role !== 'admin' && user.email !== 'eliaslongstaff@gmail.com') {
                return NextResponse.json({ error: 'Unauthorized for permanent deletion. Role: ' + (profile?.role || 'none') }, { status: 403 })
            }

            if (id === 'all') {
                const query = supabase
                    .from('tracking_trips')
                    .delete({ count: 'exact' })
                    .eq('status', 'deleted')
                
                if (warehouse) {
                    result = await query.eq('warehouse', warehouse)
                } else {
                    result = await query
                }
            } else {
                result = await supabase
                    .from('tracking_trips')
                    .delete({ count: 'exact' })
                    .eq('id', id)
            }
        } else {
            result = await supabase
                .from('tracking_trips')
                .update({ status: 'deleted', updated_at: new Date().toISOString() })
                .eq('id', id)
        }

        const { error, count } = result as any

        if (error) {
            console.error('API: Supabase delete error:', error)
            throw error
        }

        console.log('API: Operation successful, rows affected:', count)

        return NextResponse.json({ success: true, deletedCount: count, type: isPermanent ? 'permanent' : 'soft' })
    } catch (error: any) {
        console.error('DELETE /api/tracking error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
