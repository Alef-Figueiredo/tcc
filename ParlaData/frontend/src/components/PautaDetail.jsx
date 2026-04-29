// src/components/PautaDetail.jsx
import { useState, useEffect } from 'react';
import './css/PautaDetail.css';


const PautaDetail = ({ pauta, onBack }) => {
  const [detalhes, setDetalhes] = useState(null);
  const [votacoes, setVotacoes] = useState([]);
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVotos, setLoadingVotos] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Detalhes da proposição
        const resProposicao = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pauta.id}`);
        const dataProposicao = await resProposicao.json();
        setDetalhes(dataProposicao.dados);

        // Votações da proposição
        const resVotacoes = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pauta.id}/votacoes?itens=10`);
        const dataVotacoes = await resVotacoes.json();
        setVotacoes(dataVotacoes.dados || []);

        // Votos da votação mais recente
        if (dataVotacoes.dados?.length > 0) {
          const ultimaVotacao = dataVotacoes.dados[0];
          setLoadingVotos(true);
          const resVotos = await fetch(`https://dadosabertos.camara.leg.br/api/v2/votacoes/${ultimaVotacao.id}/votos?itens=500`);
          const dataVotos = await resVotos.json();
          setVotos(dataVotos.dados || []);
          setLoadingVotos(false);
        }
      } catch (err) {
        console.error('Erro ao buscar detalhes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [pauta.id]);

  // Calcula totais da votação mais recente
  const calcularTotais = () => {
    let favoraveis = 0, contrarios = 0, abstencoes = 0;
    votos.forEach(v => {
      const voto = (v.voto || '').toLowerCase();
      if (voto === 'sim') favoraveis++;
      else if (voto === 'não' || voto === 'nao') contrarios++;
      else if (voto.includes('absten')) abstencoes++;
    });
    const total = favoraveis + contrarios + abstencoes;
    return { favoraveis, contrarios, abstencoes, total };
  };

  const totais = calcularTotais();

  const getStatusBadge = (status) => {
    if (!status) return { text: 'Em Andamento', color: 'andamento' };
    if (status.toLowerCase() === 'aprovada') return { text: 'Aprovada', color: 'aprovada' };
    if (status.toLowerCase() === 'rejeitada') return { text: 'Rejeitada', color: 'rejeitada' };
    return { text: status, color: 'andamento' };
  };

  const status = votacoes.length > 0 ? getStatusBadge(votacoes[0].aprovacao) : { text: 'Em Andamento', color: 'andamento' };

  if (loading) {
    return <div className="pautas-page"><p className="loading-text">Carregando detalhes da pauta...</p></div>;
  }

  return (
  <div className="pautas-page pauta-detail-page">
    {/* HEADER COM BOTÃO + BADGE SEPARADOS */}
    <div className="detail-header">
      <button className="back-button" onClick={onBack}>
        ← Voltar para as pautas
      </button>
      <span className={`status-badge status-${status.color}`}>
        {status.text}
      </span>
    </div>

    {/* Título */}
    <h1 className="pauta-title">{pauta.titulo}</h1>

      {/* Descrição / Ementa */}
      <p className="pauta-meta">
        {detalhes?.descricaoTipo || ''} • {pauta.area || 'Tema não informado'}
      </p>

      <div className="detail-card">
        <h2>Ementa / Descrição</h2>
        <p className="ementa-text">
          {detalhes?.ementa || pauta.descricao || 'Ementa não disponível.'}
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-label">Total de Votações</span>
          <span className="card-value">{votacoes.length}</span>
        </div>
        <div className="summary-card">
          <span className="card-label favoravel">Votos Favoráveis</span>
          <span className="card-value favoravel">{totais.favoraveis}</span>
        </div>
        <div className="summary-card">
          <span className="card-label contrario">Votos Contrários</span>
          <span className="card-value contrario">{totais.contrarios}</span>
        </div>
        <div className="summary-card">
          <span className="card-label">Abstenções</span>
          <span className="card-value">{totais.abstencoes}</span>
        </div>
      </div>

      {/* Histórico de Votações */}
      <h2 className="section-title">Histórico de Votações ({votacoes.length})</h2>
      {votacoes.map((votacao, index) => (
        <div key={index} className="history-card">
          <div className="history-header">
            <span className="history-status">
              {votacao.aprovacao === 'Aprovada' ? '✅ Aprovada' : '⏳ Em andamento'}
            </span>
            <span className="history-date">
              {votacao.data ? new Date(votacao.data).toLocaleString('pt-BR') : 'Data não informada'}
            </span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-favoravel" style={{ width: `${totais.total ? (totais.favoraveis / totais.total) * 100 : 0}%` }}></div>
              <div className="progress-contrario" style={{ width: `${totais.total ? (totais.contrarios / totais.total) * 100 : 0}%` }}></div>
              <div className="progress-abstencao" style={{ width: `${totais.total ? (totais.abstencoes / totais.total) * 100 : 0}%` }}></div>
            </div>
          </div>
          <div className="history-numbers">
            <span className="favoravel">{totais.favoraveis} Favoráveis</span>
            <span className="contrario">{totais.contrarios} Contrários</span>
            <span>{totais.abstencoes} Abstenções</span>
          </div>
        </div>
      ))}

      {/* Tabela de votos individuais */}
      <h2 className="section-title">Votos dos Deputados</h2>
      {loadingVotos ? (
        <p className="loading-text">Carregando votos...</p>
      ) : votos.length > 0 ? (
        <div className="votos-table-container">
          <table className="votos-table">
            <thead>
              <tr>
                <th>Deputado</th>
                <th>Partido</th>
                <th>Estado</th>
                <th>Voto</th>
              </tr>
            </thead>
            <tbody>
              {votos.map((voto, i) => {
                const dep = voto.deputado || {};
                const votoStr = voto.voto || '—';
                const classe = votoStr.toLowerCase().includes('sim') ? 'sim' :
                               (votoStr.toLowerCase().includes('não') || votoStr.toLowerCase().includes('nao')) ? 'nao' : 'outro';
                return (
                  <tr key={i}>
                    <td>{dep.nome || '—'}</td>
                    <td>{dep.siglaPartido || '—'}</td>
                    <td>{dep.siglaUf || '—'}</td>
                    <td className={`voto-cell ${classe}`}>{votoStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">Nenhum voto encontrado para esta pauta.</p>
      )}
    </div>
  );
};

export default PautaDetail;