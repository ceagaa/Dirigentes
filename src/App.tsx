import type { AbaNav, Estado, RegistroMes, Tela } from './lib/dominio'
import { useEffect, useMemo, useRef, useState } from 'react'
import AppHeader from './components/AppHeader'
import type { Notificacao } from './components/SinoNotificacoes'
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

  async function tentarSincronizar() {
    setStatus('salvando')
    try {
      await salvarEstado(estado)
      setStatus('sincronizado')
    } catch {
      setStatus('erro')
    }
  }

  function montarNotificacoes(): Notificacao[] {
    const lista: Notificacao[] = []
    const pendentes = ocorrencias.length - designados

    if (status === 'erro') {
      lista.push({
        id: 'sync-erro',
        titulo: 'Sem sincronização',
        detalhe: 'Toque para tentar gravar na nuvem',
        tom: 'alerta',
        aoClicar: tentarSincronizar,
      })
    } else if (status === 'local') {
      lista.push({
        id: 'sync-local',
        titulo: 'Salvo neste aparelho',
        detalhe: 'Sem conexão com a nuvem no momento',
        tom: 'neutro',
      })
    }

    if (!dirigentes.length) {
      lista.push({
        id: 'sem-dirigentes',
        titulo: 'Nenhum dirigente cadastrado',
        detalhe: 'Cadastre a equipe para gerar a escala',
        tom: 'alerta',
        aoClicar: () => setTela('dirigentes'),
      })
    } else if (!campos.length) {
      lista.push({
        id: 'sem-campos',
        titulo: 'Sem dias de campo',
        detalhe: 'Configure dia, horário e ponto de encontro',
        tom: 'alerta',
        aoClicar: () => setTela('config'),
      })
    } else if (ocorrencias.length && pendentes > 0) {
      lista.push({
        id: `pend-${chave}`,
        titulo: `${pendentes} de ${ocorrencias.length} dias sem designação`,
        detalhe: `Monte a escala de ${nomeMes(mes)}`,
        tom: 'alerta',
        aoClicar: () => setTela('montagem'),
      })
    } else if (pronta) {
      lista.push({
        id: `pronta-${chave}`,
        titulo: `Designação de ${nomeMes(mes)} pronta`,
        detalhe: 'Todos os dias com dirigente',
        tom: 'sucesso',
        aoClicar: () => setTela('resumo'),
      })
    }

    if (proximoPronto) {
      lista.push({
        id: `prox-${proximo.chave}`,
        titulo: `Escala de ${nomeMes(proximo.mes)} pronta`,
        detalhe: 'Abra para conferir o próximo mês',
        tom: 'sucesso',
        aoClicar: () => {
          setAno(proximo.ano)
          setMes(proximo.mes)
        },
      })
    }

    return lista
  }

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
  const tituloHeader =
    tela === 'montagem'
      ? 'Montar designação'
      : tela === 'dirigentes'
        ? 'Dirigentes'
        : tela === 'config'
          ? 'Configurações'
          : 'Início'

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

      <AppHeader
        titulo={tituloHeader}
        notificacoes={montarNotificacoes()}
        aoVoltar={tela === 'montagem' ? () => setTela('resumo') : undefined}
      />

      <main className="mx-auto w-full max-w-[640px] px-4 py-5 pb-28">
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
            ano={ano}
            mes={mes}
            efetivas={efetivas}
            aoAlterar={(lista) => atualizar((e) => ({ ...e, dirigentes: lista }))}
            aoIrParaConfig={() => setTela('config')}
          />
        ) : null}

        {tela === 'config' ? (
          <ConfigCampos
            config={config}
            campos={campos}
            dirigentes={dirigentes}
            sincronizado={status === 'sincronizado'}
            aoAlterarConfig={(patch) =>
              atualizar((e) => ({
                ...e,
                escalas: { ...e.escalas, _config: { ...e.escalas._config, ...patch } },
              }))
            }
            aoAlterarCampos={(lista) => atualizar((e) => ({ ...e, config_campos: lista }))}
            aoExportar={exportar}
            aoCopiarLink={copiarLink}
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
