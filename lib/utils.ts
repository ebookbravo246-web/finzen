export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

export function getMonthYear(date = new Date()): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function categoryColor(category: string): string {
  const colors: Record<string, string> = {
    Moradia:      '#0F6E56',
    Alimentação:  '#E24B4A',
    Transporte:   '#BA7517',
    Lazer:        '#178BA5',
    Saúde:        '#9B59B6',
    Educação:     '#2980B9',
    Receita:      '#1D9E75',
    Outros:       '#888780',
  }
  return colors[category] ?? '#888780'
}

export function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Moradia:     '🏠',
    Alimentação: '🍔',
    Transporte:  '🚗',
    Lazer:       '🎬',
    Saúde:       '🏥',
    Educação:    '📚',
    Receita:     '💼',
    Outros:      '📦',
  }
  return icons[category] ?? '📦'
}
