import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y password requeridos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Check if any admin exists
    const { data: existingAdmins } = await supabaseAdmin.from('user_roles').select('id').eq('role', 'admin').limit(1)
    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe un administrador. Usa el panel admin para crear más usuarios.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Create the admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Administrador' },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Assign admin role
    if (newUser.user) {
      await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: 'admin' })
    }

    return new Response(JSON.stringify({ success: true, message: 'Admin creado exitosamente' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
