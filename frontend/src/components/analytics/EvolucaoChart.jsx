'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#101942] text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs space-y-1">
        <p className="font-bold text-sm text-white">{label}</p>
        <p className="text-emerald-400 font-semibold">
          Média:{' '}
          {data.media !== null
            ? `${data.media.toFixed(2).replace('.', ',')} ${data.unidade || 'pts'}`
            : 'Sem dados'}
        </p>
        <p className="text-slate-300">
          Avaliados: {data.avaliados} {data.avaliados === 1 ? 'aluno' : 'alunos'}
        </p>
      </div>
    );
  }
  return null;
}

export function EvolucaoChart({
  data = [],
  titulo = 'Evolução do Rendimento por Bimestre',
  escalaMax = 10,
  percentual = false,
}) {
  // Prepara dados para o Recharts (troca null por undefined para não desenhar quebras estranhas)
  const chartData = data.map((d) => ({
    ...d,
    mediaExibicao: d.media !== null ? d.media : null,
  }));

  const temDados = data.some((d) => d.media !== null);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-[#101942]">{titulo}</h4>
          <p className="text-xs text-slate-500 font-medium">
            Desempenho histórico médio nos 4 bimestres letivos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#f60c49]" />
          <span className="text-xs font-semibold text-slate-600">
            {percentual ? '% da escala de cada turma' : 'Notas do Diário'}
          </span>
        </div>
      </div>

      <details>
        <summary className="cursor-pointer text-sm">Ver dados da evolução</summary>
        <table className="text-sm w-full">
          <caption className="sr-only">Evolução por bimestre</caption>
          <thead>
            <tr>
              <th>Período</th>
              <th>Média</th>
              <th>Avaliados</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.bimestre}>
                <td>{d.bimestre}</td>
                <td>
                  {d.media === null ? 'Sem dados' : d.media.toFixed(2)} {percentual ? '%' : 'pts'}
                </td>
                <td>{d.avaliados}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      {!temDados ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            📊
          </div>
          <span>Nenhuma nota lançada nos bimestres selecionados</span>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="bimestre"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                domain={[0, escalaMax]}
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mediaExibicao"
                name="Média"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMedia)"
                dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#f60c49', strokeWidth: 2, stroke: '#ffffff' }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
