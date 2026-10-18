import { CONGREGACAO_PADRAO, TITULO_PADRAO, frequenciaValida } from './constants'

export const ID_REGISTRO = 'default_config'
export const CHAVE_LOCAL = 'dirigentes:estado:v1'

export function estadoInicial() {
  return {
    dirigentes: [
      {
        id: 'dir-1',
        nome: 'Carlos Andrade',
        telefone: '(11) 99911-2233',
        ativo: true,
        frequencia: 'semanal',
        dias: [0, 3],
        horarios: ['09:00', '19:30'],
      },
      {
        id: 'dir-2',
        nome: 'Marcos Lima',
        telefone: '(11) 98844-5566',
        ativo: true,
        frequencia: 'quinzenal',
        dias: [0, 4, 6],
        horarios: ['09:00', '19:30'],
      },
      {
        id: 'dir-3',
        nome: 'João Pedro',
        telefone: '',
        ativo: true,
        frequencia: 'quinzenal',
        dias: [3, 4],
        horarios: ['19:30'],
      },
      {
        id: 'dir-4',
        nome: 'Rafael Souza',
        telefone: '(11) 97733-8899',
        ativo: true,
        frequencia: 'mensal',
        dias: [0, 3, 4],
        horarios: ['09:00', '19:30'],
      },
      {
        id: 'dir-5',
        nome: 'Paulo Mendes',
        telefone: '',
        ativo: true,
        frequencia: 'mensal',
        dias: [0, 6],
        horarios: ['09:00'],
      },
      {
        id: 'dir-6',
        nome: 'André Oliveira',
        telefone: '(11) 96622-1100',
        ativo: false,
        frequencia: 'bimestral',
        dias: [3],
        horarios: ['19:30'],
      },
    ],
    config_campos: [
      {
        id: 'campo-1',
        diaSemana: 0,
        horario: '09:00',
        local: 'Esquina da Praça Central',
        fixo: null,
      },
      {
        id: 'campo-2',
        diaSemana: 3,
        horario: '19:30',
        local: 'Terminal Rodoviário',
        fixo: null,
      },
      {
        id: 'campo-3',
        diaSemana: 4,
        horario: '19:30',
        local: 'Feira Livre - Av. Brasil',
        fixo: null,
      },
    ],
    escalas: {
      _config: {
        titulo: TITULO_PADRAO,
        congregacao: CONGREGACAO_PADRAO,
        designacao_fixa: false,
        frequencia_padrao: 'quinzenal',
      },
    },
  }
}

/** Normaliza qualquer estado vindo do banco/local preservando o formato mínimo. */
export function normalizarEstado(bruto) {
  const base = estadoInicial()
  if (!bruto || typeof bruto !== 'object') return base

  const config = bruto.escalas?._config ?? {}

  const normalizarCampos = (lista) =>
    lista.map((c) => ({
      ...c,
      diaSemana: Number(c.diaSemana),
      fixo: c.fixo || null,
    }))

  return {
    dirigentes: Array.isArray(bruto.dirigentes) ? bruto.dirigentes : base.dirigentes,
    config_campos: Array.isArray(bruto.config_campos)
      ? normalizarCampos(bruto.config_campos)
      : base.config_campos,
    escalas: {
      ...(bruto.escalas && typeof bruto.escalas === 'object' ? bruto.escalas : {}),
      _config: {
        titulo: config.titulo || TITULO_PADRAO,
        congregacao: config.congregacao || CONGREGACAO_PADRAO,
        designacao_fixa: config.designacao_fixa === true,
        frequencia_padrao: frequenciaValida(config.frequencia_padrao),
      },
    },
  }
}
