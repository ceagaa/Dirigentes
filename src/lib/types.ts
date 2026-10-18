export default function css(literal: TemplateStringsArray, ..._interpolacoes: unknown[]): string {
  return literal.join('')
}
