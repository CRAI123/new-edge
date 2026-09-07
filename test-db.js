import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('Testing connection to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('Connection failed:', error.message)
      console.error('Error details:', error)
    } else {
      console.log('Connection successful! Total profiles:', data)
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

test()
