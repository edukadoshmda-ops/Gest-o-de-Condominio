import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xarljytgieadligbrtzf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmxqeXRnaWVhZGxpZ2JydHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDI1MTgsImV4cCI6MjA4NzIxODUxOH0.rwODIj4r_S5rd8Y08dincentXbzfArIq6-ZYSHyc7G0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDelete() {
    const { data: condominios, error: fetchError } = await supabase
        .from('condominios')
        .select('*')
        .eq('codigo_acesso', '1234')
        .limit(1)

    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return
    }

    if (condominios && condominios.length > 0) {
        const targetId = condominios[0].id
        console.log('Attempting to delete:', targetId)

        const { error: deleteError } = await supabase
            .from('condominios')
            .delete()
            .eq('id', targetId)

        if (deleteError) {
            console.error('Delete error:', deleteError)
        } else {
            console.log('Delete successful')
        }
    } else {
        console.log('No condominios found context')
    }
}

testDelete()
