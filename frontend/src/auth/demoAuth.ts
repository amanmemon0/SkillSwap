export type Role = 'admin' | 'user'
export type DemoSession = { name: string; email: string; role: Role }

const accounts: Array<DemoSession & { password: string }> = [
  { name: 'Olivia Bennett', email: 'admin@skillswap.city', password: 'Admin@123', role: 'admin' },
  { name: 'Alex Morgan', email: 'user@skillswap.city', password: 'User@123', role: 'user' },
]

const key = 'skillswap-demo-session'
export function signIn(email: string, password: string): DemoSession | null {
  const account = accounts.find(item => item.email.toLowerCase() === email.toLowerCase() && item.password === password)
  if (!account) return null
  const { password: _, ...session } = account
  localStorage.setItem(key, JSON.stringify(session))
  return session
}
export function session(): DemoSession | null { try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null } }
export function signOut() { localStorage.removeItem(key) }
export function createDemoUser(name: string, email: string): DemoSession {
  const created = { name, email, role: 'user' as const }
  localStorage.setItem(key, JSON.stringify(created))
  return created
}
