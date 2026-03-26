import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient as createClient } from '@/lib/supabase-server'

// GET - Listar todos los usuarios con sus roles
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient()

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que sea ADMIN
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (userRoles?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        // Obtener todos los usuarios
        const { data: users, error: usersError } = await supabase
            .from('auth.users')
            .select('id, email, user_metadata')

        if (usersError) throw usersError

        // Obtener roles de cada usuario
        const { data: allUserRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role')

        if (rolesError) throw rolesError

        // Combinar usuarios con sus roles
        const usersWithRoles = users.map((u: any) => ({
            id: u.id,
            email: u.email,
            full_name: u.user_metadata?.full_name || '',
            roles: allUserRoles
                .filter((ur: any) => ur.user_id === u.id)
                .map((ur: any) => ur.role),
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
        }))

        return NextResponse.json(usersWithRoles)
    } catch (error: any) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient()

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que sea ADMIN
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (userRoles?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        const body = await request.json()
        const { email, password, full_name, role } = body

        if (!email || !password || !role) {
            return NextResponse.json(
                { error: 'Email, password and role are required' },
                { status: 400 }
            )
        }

        // Crear usuario en auth.users
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: {
                full_name: full_name || '',
            },
        })

        if (createError) throw createError

        // Asignar rol al usuario
        const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
                user_id: authUser.user.id,
                role: role,
            })

        if (roleError) throw roleError

        return NextResponse.json({
            id: authUser.user.id,
            email: authUser.user.email,
            full_name,
            role,
        })
    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT - Actualizar usuario (cambiar rol)
export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient()

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que sea ADMIN
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (userRoles?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        const body = await request.json()
        const { user_id, role } = body

        if (!user_id || !role) {
            return NextResponse.json(
                { error: 'user_id and role are required' },
                { status: 400 }
            )
        }

        // Cambiar rol
        const { error: deleteError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user_id)

        if (deleteError) throw deleteError

        const { error: insertError } = await supabase
            .from('user_roles')
            .insert({
                user_id,
                role,
            })

        if (insertError) throw insertError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Eliminar usuario
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient()

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que sea ADMIN
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()

        if (userRoles?.role !== 'admin') {
            return NextResponse.json({ error: 'Privilegios de administrador requeridos' }, { status: 403 })
        }

        const body = await request.json()
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json(
                { error: 'user_id is required' },
                { status: 400 }
            )
        }

        // Eliminar roles asociados
        const { error: roleError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', user_id)

        if (roleError) throw roleError

        // Eliminar usuario
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)

        if (deleteError) throw deleteError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}