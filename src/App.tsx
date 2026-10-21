import type { AbaNav, Estado, RegistroMes, Tela } from './lib/dominio'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleAlert,
  CloudCheck,
  CloudOff,
  Loader2,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import BottomNav from './components/BottomNav'
import CadastroDirigentes from './components/CadastroDirigentes'
import ConfigCampos from './components/ConfigCampos'
import EscalaCard from './components/EscalaCard'
import ExportModal from './components/ExportModal'
import ResumoDesignacao from './components/ResumoDesignacao'
import Splash from './components/Splash'
import TabelaEscala from './components/TabelaEscala'
import TelaVer from './components/TelaVer'
import { lerHashVer, linkDe, montarPayload } from './lib/compartilhamento'
import { chaveMes, ocorrenciasDoMes, nomeMes } from './lib/datas'
import { estadoInicial, registroDe } from './lib/estadoInicial'
import { gerarEscalaDoMes, proximoMes } from './lib/gerador'
import { carregarEstado, gerarEscalaRemota, salvarEstado } from './lib/api'

type StatusId = 'carregando' | 'salvando' | 'sincronizado' | 'local' | 'erro'

interface StatusInfo {
  texto: string
  Icone: LucideIcon
  gira?: boolean
  estilo: string
}

const STATUS: Record<StatusId, StatusInfo> = {
  carregando: { texto: 'Carregando…', Icone: Loader2, gira: true, estilo: 'bg-canvas text-muted' },
  salvando: { texto: 'Salvando…', Icone: RefreshCw, gira: true, estilo: 'bg-canvas text-muted' },
  sincronizado: { texto: 'Sincronizado', Icone: CloudCheck, estilo: 'bg-petrol-soft text-petrol' },
  local: { texto: 'Salvo neste aparelho', Icone: CloudOff, estilo: 'bg-canvas text-muted' },
  erro: { texto: 'Sem sincronização', Icone: CircleAlert, estilo: 'bg-wine-soft text-wine' },
}

export default function App() {
  const [estado, setEstado] = useState<Estado>(estadoInicial)
  const [pronto, setPronto] = useState(false)
  const [splash, setSplash] = useState<'ativo' | 'saindo' | null>('ativo')
  const [status, setStatus] = useState<StatusId>('carregando')
  const [tela, setTela] = useState<Tela>('resumo')
  const [ano, setAno] = useState(() => new Date().getFullYear())
  const [mes, setMes] = useState(() => new Date().getMonth())
  const [manterManuais, setManterManuais] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [aviso, setAviso] = useState('')
  const [payloadVer, setPayloadVer] = useState<string | null>(() => lerHashVer())
  const cardRef = useRef<HTMLDivElement>(null)
  const inicioSplash = useRef(0)

  const { dirigentes, config_campos: campos, escalas } = estado
  const config = escalas._config
  const chave = chaveMes(ano, mes)
  const registro = registroDe(escalas, chave)

  const ocorrencias = useMemo(
    () => ocorrenciasDoMes(ano, mes, campos),
    [ano, mes, campos],
  )

  const efetivas = useMemo(() => {
    const base = { ...(registro.auto ?? {}) }
    for (const [k, v] of Object.entries(registro.manuais ?? {})) base[k] = v
    return base
  }, [registro])

  const designados = ocorrencias.filter((o) => efetivas[o.key]).length
  const pronta = ocorrencias.length > 0 && designados === ocorrencias.length

  const proximo = useMemo(() => proximoMes(ano, mes), [ano, mes])
  const proximoPronto = registroDe(escalas, proximo.chave).geradoEm != null

  useEffect(() => {
    let vivo = true
    inicioSplash.current = Date.now()
    carregarEstado().then(({ estado: carregado, origem }) => {
      if (!vivo) return
      setEstado(carregado)
      setPronto(true)
      setStatus(origem === 'nuvem' ? 'sincronizado' : 'local')
    })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (!pronto || splash !== 'ativo') return undefined
    const restante = Math.max(0, 1100 - (Date.now() - inicioSplash.current))
    const saida = setTimeout(() => {
      setSplash('saindo')
      setTimeout(() => setSplash(null), 450)
    }, restante)
    return () => clearTimeout(saida)
  }, [pronto, splash])

  useEffect(() => {
    const aoMudarHash = () => setPayloadVer(lerHashVer())
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tela])

  useEffect(() => {
    if (!pronto) return undefined
    const timer = setTimeout(async () => {
      setStatus('salvando')
      try {
        await salvarEstado(estado)
        setStatus('sincronizado')
      } catch {
        setStatus('erro')
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [estado, pronto])

  useEffect(() => {
    if (!aviso) return undefined
    const timer = setTimeout(() => setAviso(''), 3200)
    return () => clearTimeout(timer)
  }, [aviso])

  function atualizar(fn: (estado: Estado) => Estado) {
    setEstado((atual) => fn(atual))
  }

  function alterarRegistro(chaveDoMes: string, novoRegistro: RegistroMes) {
    atualizar((e) => ({ ...e, escalas: { ...e.escalas, [chaveDoMes]: novoRegistro } as Estado['escalas'] }))
  }

  function gerar() {
    const manuais = manterManuais ? (registro.manuais ?? {}) : {}
    const atualizado: Estado = {
      ...estado,
      escalas: { ...estado.escalas, [chave]: { ...registro, manuais } } as Estado['escalas'],
    }
    setEstado(gerarEscalaDoMes(atualizado, chave, { forcar: true }))
    setAviso(
      ocorrencias.length
        ? `Designação de ${nomeMes(mes)} de ${ano} gerada.`
        : 'Nenhum dia de campo neste mês.',
    )
  }

  /** Gera (ou tenta gerar) a escala do mês seguinte: Worker primeiro, local se offline. */
  async function adiantarProximoMes() {
    if (proximoPronto) {
      setAviso(`Escala de ${nomeMes(proximo.mes)} já existe.`)
      return
    }
    const resultado = await gerarEscalaRemota(proximo.chave)
    if (resultado.ok) {
      setEstado(resultado.estado)
      setAviso(`Escala de ${nomeMes(proximo.mes)} de ${proximo.ano} gerada.`)
      return
    }
    if (resultado.motivo === 'existe') {
      const { estado: doServidor } = await carregarEstado()
      setEstado(doServidor)
      setAviso(`Escala de ${nomeMes(proximo.mes)} já existe no servidor.`)
      return
    }
    setEstado(gerarEscalaDoMes(estado, proximo.chave))
    setAviso(`Sem conexão: escala de ${nomeMes(proximo.mes)} gerada neste aparelho.`)
  }

  function alterarDesignacao(key: string, valor: string) {
    const auto = registro.auto ?? {}
    const manuais = { ...(registro.manuais ?? {}) }

    if (valor === '') {
      if (auto[key]) manuais[key] = ''
      else delete manuais[key]
    } else if (valor === auto[key]) {
      delete manuais[key]
    } else {
      manuais[key] = valor
    }

    alterarRegistro(chave, { ...registro, manuais })
  }

  function limparManuais() {
    alterarRegistro(chave, { ...registro, manuais: {} })
    setAviso('Ajustes manuais removidos: a escala voltou ao rodízio automático.')
  }

  function exportar() {
    if (tela === 'montagem' && !cardRef.current) {
      setAviso('Gere a designação antes de exportar.')
      return
    }
    setModalAberto(true)
  }

  function copiarLink() {
    try {
      const payload = montarPayload({
        config,
        chave,
        ocorrencias,
        designacoes: efetivas,
        dirigentes,
      })
      if (!payload.r.length) {
        setAviso('Gere a designação antes de copiar o link.')
        return
      }
      navigator.clipboard
        ?.writeText(linkDe(payload))
        .then(() => setAviso('Link da designação copiado.'))
        .catch(() => setAviso('Não foi possível copiar o link.'))
    } catch {
      setAviso('Não foi possível copiar o link.')
    }
  }

  function voltarDoApp() {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setPayloadVer(null)
  }

  const abaNav: AbaNav = tela === 'montagem' ? 'designacao' : (tela as AbaNav)
  const info = STATUS[status]

  if (payloadVer) {
    return (
      <div className="min-h-svh">
        <TelaVer payload={payloadVer} aoVoltar={voltarDoApp} aoAvisar={setAviso} />
        {aviso ? (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-5 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          >
            {aviso}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      {splash ? <Splash congregacao={config.congregacao} saindo={splash === 'saindo'} /> : null}

      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center bg-petrol text-white"
              aria-hidden="true"
            >
              <MapPin className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] font-bold leading-tight text-ink">
                Dirigentes
              </p>
              <p className="truncate text-[11px] text-muted">{config.congregacao}</p>
            </div>
          </div>

          <p
            className={`flex shrink-0 items-center gap-1.5 border border-line px-2 py-1 text-[11px] font-semibold ${info.estilo}`}
            role="status"
            title={info.texto}
          >
            <info.Icone
              className={`size-3.5 ${info.gira ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span className="sr-only sm:not-sr-only">{info.texto}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 pb-28">
        {tela === 'resumo' ? (
          <ResumoDesignacao
            ano={ano}
            mes={mes}
            aoMudarData={(novoAno, novoMes) => {
              setAno(novoAno)
              setMes(novoMes)
            }}
            ocorrencias={ocorrencias}
            efetivas={efetivas}
            dirigentes={dirigentes}
            campos={campos}
            pronta={pronta}
            proximoNome={nomeMes(proximo.mes)}
            proximoPronto={proximoPronto}
            aoAdiantar={adiantarProximoMes}
            aoVerProximo={() => {
              setAno(proximo.ano)
              setMes(proximo.mes)
            }}
            aoMontar={() => setTela('montagem')}
            aoVer={exportar}
            aoCopiarLink={copiarLink}
            aoConfigurar={() => setTela('config')}
            aoCadastrar={() => setTela('dirigentes')}
          />
        ) : null}

        {tela === 'montagem' ? (
          <TabelaEscala
            ano={ano}
            mes={mes}
            config={config}
            aoMudarData={(novoAno, novoMes) => {
              setAno(novoAno)
              setMes(novoMes)
            }}
            dirigentes={dirigentes}
            campos={campos}
            ocorrencias={ocorrencias}
            registro={registro}
            efetivas={efetivas}
            manterManuais={manterManuais}
            aoAlterarManter={setManterManuais}
            aoGerar={gerar}
            aoAlterarDesignacao={alterarDesignacao}
            aoLimparManuais={limparManuais}
            aoConfigurar={() => setTela('config')}
            aoCadastrar={() => setTela('dirigentes')}
            cardRef={cardRef}
            pronta={pronta}
            aoConcluir={() => {
              setTela('resumo')
              setModalAberto(true)
            }}
          />
        ) : null}

        {tela === 'dirigentes' ? (
          <CadastroDirigentes
            dirigentes={dirigentes}
            campos={campos}
            frequenciaPadrao={config.frequencia_padrao}
            aoAlterar={(lista) => atualizar((e) => ({ ...e, dirigentes: lista }))}
          />
        ) : null}

        {tela === 'config' ? (
          <ConfigCampos
            config={config}
            campos={campos}
            dirigentes={dirigentes}
            aoAlterarConfig={(patch) =>
              atualizar((e) => ({
                ...e,
                escalas: { ...e.escalas, _config: { ...e.escalas._config, ...patch } },
              }))
            }
            aoAlterarCampos={(lista) => atualizar((e) => ({ ...e, config_campos: lista }))}
          />
        ) : null}
      </main>

      <BottomNav aba={abaNav} aoMudar={(id) => setTela(id === 'designacao' ? 'resumo' : id)} />

      {modalAberto && tela !== 'montagem' ? (
        <div
          className="fixed left-[-10000px] top-0 w-[760px] overflow-hidden"
          aria-hidden="true"
        >
          <EscalaCard
            ref={cardRef}
            config={config}
            ocorrencias={ocorrencias}
            dirigentes={dirigentes}
            designacoes={efetivas}
            manuais={registro.manuais ?? {}}
          />
        </div>
      ) : null}

      {modalAberto ? (
        <ExportModal
          aberto={modalAberto}
          aoFechar={() => setModalAberto(false)}
          noAlvo={cardRef}
          chave={chave}
          ano={ano}
          mes={nomeMes(mes)}
          config={config}
          ocorrencias={ocorrencias}
          efetivas={efetivas}
          dirigentes={dirigentes}
          aoAvisar={setAviso}
        />
      ) : null}

      {aviso ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          {aviso}
        </div>
      ) : null}
    </div>
  )
}
