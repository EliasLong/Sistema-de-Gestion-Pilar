import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function test() {
  console.log('Testing is_deleted column...')
  const { data, error } = await supabase
    .from('tracking_trips')
    .select('id, is_deleted')
    .limit(1)
  
  if (error) {
    console.log('Error or column missing:', error.message)
    if (error.message.includes('column "is_deleted" does not exist')) {
        console.log('Column is definitely missing.')
    }
  } else {
    console.log('Column exists! Data:', data)
  }
}

test()
