export const getBearerToken = (req: Request) => {
  const header = req.headers.get('Authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? null
}

export const isServiceRoleRequest = (req: Request) => {
  const token = getBearerToken(req)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  return Boolean(token && serviceRoleKey && token === serviceRoleKey)
}

export const isAuthenticatedRequest = async (req: Request) => {
  const token = getBearerToken(req)
  if (!token) return false

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anonKey) return false

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  })

  if (!res.ok) return false
  const user = await res.json()
  return Boolean(user?.id)
}
