import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient as createClient } from '@/lib/supabase-server'
import { UserRole } from '@/types/database'

// Endpoint to retrieve all users (Requires Admin)
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient()
        // Authenticate request
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verify if the caller is an admin
        const { data: currentUserData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (currentUserData?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ users: data })
    } catch (error: any) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Endpoint to update a user's role (Requires Admin)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createClient()
        // Authenticate request
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verify if the caller is an admin
        const { data: currentUserData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (currentUserData?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        const body = await request.json()
        const { targetUserId, newRole } = body

        if (!targetUserId || !newRole) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos (targetUserId, newRole)' }, { status: 400 })
        }

        // Apply update
        const { data, error } = await supabase
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', targetUserId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ user: data })

    } catch (error: any) {
        console.error('Error updating user role:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
