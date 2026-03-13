import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Mock createClient until Supabase is correctly integrated
const createClient = () => {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: 'mock-user' } }, error: null })
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        range: (from: number, to: number) => ({ data: [], error: null, count: 0 })
      }),
      insert: (data: any) => ({
        select: () => ({ single: () => ({ data: { ...data, id: 'mock-id' }, error: null }) })
      })
    })
  }
}

const createTripSchema = z.object({
  client_id: z.string().uuid(),
  shipping_method: z.enum(['ground', 'air', 'sea', 'multimodal'])
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data, error, count } = await supabase
      .from('trips')
      .select()
      .range((page - 1) * limit, page * limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count }
    })
  } catch (error) {
    console.error('GET /api/trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createTripSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('trips')
      .insert({ ...validation.data, created_by: user.id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('POST /api/trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
