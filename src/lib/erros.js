/**
 * Traduz mensagens de erro técnicas para português amigável ao usuário.
 */
export function traduzirErro(msg) {
  if (!msg || typeof msg !== 'string') return 'Ocorreu um erro. Tente novamente.'
  const m = msg.toLowerCase()
  if (m.includes('row-level security') || m.includes('row level security'))
    return 'Você não tem permissão para esta ação. Verifique se está vinculado a um condomínio.'
  if (m.includes('relation') && m.includes('does not exist'))
    return 'Recurso não disponível. Entre em contato com o suporte.'
  if (m.includes('could not find the function') || (m.includes('function') && m.includes('not found')))
    return 'Recurso temporariamente indisponível. Tente novamente em instantes.'
  if (m.includes('permission denied') || m.includes('permissão negada'))
    return 'Permissão negada para esta ação.'
  if (m.includes('jwt expired') || m.includes('session'))
    return 'Sessão expirada. Faça login novamente.'
  if (m.includes('network') || m.includes('fetch') || m.includes('failed to fetch'))
    return 'Falha na conexão. Verifique sua internet.'
  if (m.includes('foreign key') || m.includes('violates foreign key'))
    return 'Dados inválidos. Verifique as informações e tente novamente.'
  if (m.includes('unique') || m.includes('duplicate'))
    return 'Este registro já existe.'
  if (m.includes('not null') || m.includes('null value'))
    return 'Preencha todos os campos obrigatórios.'
  if (m.includes('invalid') && m.includes('email'))
    return 'E-mail inválido.'
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'E-mail ou senha incorretos.'
  return msg
}
