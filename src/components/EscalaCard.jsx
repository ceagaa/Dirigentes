import { forwardRef, Fragment } from 'react'
import { CORES_PLANILHA, nomeDiaCurto } from '../lib/constants'
import { candidatosPara } from '../lib/rodizio'

const borda = { borderColor: CORES_PLANILHA.linha }
const celula = {
  backgroundColor: CORES_PLANILHA.fundo,
  color: CORES_PLANILHA.texto,
  ...borda,
}

function rotuloDia(oc) {
  return `${nomeDiaCurto(oc.diaSemana)} - ${oc.iso.slice(8, 10)}/${oc.iso.slice(5, 7)}`
}

const EscalaCard = forwardRef(function EscalaCard(
  {
    config,
    ocorrencias,
    dirigentes,
    designacoes,
    manuais = {},
    aoAlterarDesignacao,
    somenteLeitura = false,
    nomes = null,
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className="escala-card min-w-[720px] border bg-white"
      style={{ borderColor: CORES_PLANILHA.linha }}
    >
      <div className="px-8 pt-7 text-center">
        <h2
          className="text-[30px] font-bold leading-tight"
          style={{ color: CORES_PLANILHA.texto }}
        >
          {config.titulo}
        </h2>
        <p
          className="mt-1.5 border-b-[3px] pb-2 text-[15px] font-bold"
          style={{ color: CORES_PLANILHA.texto, borderColor: CORES_PLANILHA.texto }}
        >
          {config.congregacao}
        </p>
      </div>

      <table className="w-full table-fixed border-collapse text-center text-[15px]">
        <thead>
          <tr>
            <th
              colSpan={2}
              scope="col"
              className="border px-3 py-2.5 font-bold"
              style={{
                backgroundColor: CORES_PLANILHA.cabecalho,
                color: '#FFFFFF',
                ...borda,
              }}
            >
              Dia
            </th>
            <th
              scope="col"
              className="border px-3 py-2.5 font-bold"
              style={{
                backgroundColor: CORES_PLANILHA.cabecalho,
                color: '#FFFFFF',
                ...borda,
              }}
            >
              Horário
            </th>
            <th
              scope="col"
              className="border px-3 py-2.5 font-bold"
              style={{
                backgroundColor: CORES_PLANILHA.cabecalho,
                color: '#FFFFFF',
                ...borda,
              }}
            >
              Local
            </th>
            <th
              scope="col"
              className="border px-3 py-2.5 font-bold"
              style={{
                backgroundColor: CORES_PLANILHA.cabecalho,
                color: '#FFFFFF',
                ...borda,
              }}
            >
              Dirigente
            </th>
          </tr>
        </thead>
        <tbody>
          {!ocorrencias.length ? (
            <tr>
              <td colSpan={5} className="border px-4 py-10 text-center" style={borda}>
                <span className="font-semibold" style={{ color: CORES_PLANILHA.texto }}>
                  Nenhum dia de campo neste mês.
                </span>
              </td>
            </tr>
          ) : (
            ocorrencias.map((oc) => {
              const id = designacoes[oc.key] ?? ''
              const designado = dirigentes.find((d) => d.id === id)
              const manual = Boolean(manuais[oc.key])
              const candidatos = candidatosPara(oc, dirigentes)
              const nome = nomes?.[oc.key] ?? designado?.nome ?? ''

              return (
                <Fragment key={oc.key}>
                  <tr>
                    <th
                      colSpan={2}
                      scope="row"
                      className="border px-3 py-3.5 text-center font-bold"
                      style={celula}
                    >
                      {rotuloDia(oc)}
                    </th>
                    <td className="border px-3 py-3.5 text-center font-bold" style={celula}>
                      {oc.campo.horario}
                    </td>
                    <td className="border px-3 py-3.5 text-center font-bold" style={celula}>
                      {oc.campo.local}
                    </td>
                    <td className="border px-2 py-2 text-center font-bold" style={celula}>
                      {somenteLeitura ? (
                        <span className="block px-1">{nome || 'Sem designação'}</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          {manual ? (
                            <span
                              className="marcador-manual size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: CORES_PLANILHA.texto }}
                              title="Ajustada manualmente"
                              aria-hidden="true"
                            />
                          ) : null}
                          <select
                            id={`dirigente-${oc.key}`}
                            aria-label={`Dirigente designado para ${rotuloDia(oc)}`}
                            className="selecao-dirigente w-full cursor-pointer appearance-none border-0 bg-transparent px-1 py-1 text-center font-bold outline-none hover:bg-white/50"
                            style={{ color: CORES_PLANILHA.texto }}
                            value={id}
                            onChange={(e) => aoAlterarDesignacao?.(oc.key, e.target.value)}
                          >
                            <option value="">— Sem designação —</option>
                            {candidatos.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome}
                                {c.disponivel ? '' : ' (indisponível)'}
                              </option>
                            ))}
                          </select>
                          <span className="rotulo-dirigente" aria-hidden="true">
                            {nome || 'Sem designação'}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr aria-hidden="true">
                    <td
                      colSpan={5}
                      className="border-x p-0"
                      style={{ ...borda, backgroundColor: '#FFFFFF', height: '14px' }}
                    />
                  </tr>
                </Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
})

export default EscalaCard
