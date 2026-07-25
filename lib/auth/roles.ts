// ─── Roles do sistema ─────────────────────────────────────────────────────────
// Define quem é dona do negócio (ADM) vs assinante comum.

export type Role = 'admin' | 'subscriber'

/**
 * Lista de e-mails autorizados como administradora (dona do negócio).
 * Estes usuários têm acesso ao /admin e bypass de cobrança.
 *
 * Para adicionar uma nova admina, basta incluir o e-mail aqui.
 */
const ADMIN_EMAILS: readonly string[] = [
  'brunomomoshiki@gmail.com',
]

/**
 * Verifica se um e-mail é de administradora.
 * Comparação case-insensitive.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  return ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized)
}

/**
 * Deriva o role de uma usuária Firebase a partir do e-mail.
 * Se o e-mail constar na lista de adminas → 'admin'.
 * Caso contrário → 'subscriber'.
 */
export function roleFromEmail(email: string | null | undefined): Role {
  return isAdminEmail(email) ? 'admin' : 'subscriber'
}
