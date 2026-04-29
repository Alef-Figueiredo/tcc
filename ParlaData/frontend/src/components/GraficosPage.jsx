// src/components/GraficosPage.jsx
import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import './css/GraficosPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const GraficosPage = ({ onBackToHome }) => {
  const [pautas, setPautas] = useState([]);
  const [filteredPautas, setFilteredPautas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPauta, setSelectedPauta] = useState(null);
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingVotos, setLoadingVotos] = useState(false);   
  const [activeTab, setActiveTab] = useState('geral');

  // Carregar pautas
  useEffect(() => {
    const carregarPautas = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/pautas`);
        const data = await res.json();
        const lista = data || [];
        setPautas(lista);
        setFilteredPautas(lista);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    carregarPautas();
  }, []);

  // Busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPautas(pautas);
      return;
    }
    const termo = searchTerm.toLowerCase();
    const filtradas = pautas.filter(p =>
      `${p.titulo || ''} ${p.descricao || ''}`.toLowerCase().includes(termo)
    );
    setFilteredPautas(filtradas);
  }, [searchTerm, pautas]);

  const carregarVotos = async (pauta) => {
    setSelectedPauta(pauta);
    setLoadingVotos(true);
    try {
      const resVotacoes = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${pauta.id}/votacoes?itens=5`);
      const votacoesData = await resVotacoes.json();

      if (votacoesData.dados?.length > 0) {
        const ultima = votacoesData.dados[0];
        const resVotos = await fetch(`https://dadosabertos.camara.leg.br/api/v2/votacoes/${ultima.id}/votos?itens=500`);
        const votosData = await resVotos.json();
        setVotos(votosData.dados || []);
      } else {
        setVotos([]);
      }
    } catch (err) {
      console.error(err);
      setVotos([]);
    } finally {
      setLoadingVotos(false);
    }
  };

  const processarDados = () => {
    const porPartido = {};
    let sim = 0, nao = 0, abstencao = 0, ausente = 0;

    votos.forEach(v => {
      const dep = v.deputado || {};
      const voto = (v.voto || '').toLowerCase();

      if (voto === 'sim') sim++;
      else if (voto.includes('não') || voto === 'nao') nao++;
      else if (voto.includes('absten')) abstencao++;
      else ausente++;

      const partido = dep.siglaPartido || 'Sem partido';
      if (!porPartido[partido]) porPartido[partido] = { sim: 0, nao: 0 };
      if (voto === 'sim') porPartido[partido].sim++;
      else if (voto.includes('não') || voto === 'nao') porPartido[partido].nao++;
    });

    return { porPartido, sim, nao, abstencao, ausente };
  };

  const dados = processarDados();

  const dadosGerais = {
    labels: ['Sim', 'Não', 'Abstenção', 'Ausente'],
    datasets: [{ data: [dados.sim, dados.nao, dados.abstencao, dados.ausente], backgroundColor: ['#34c759', '#ff3b30', '#ffcc00', '#888'] }]
  };

  const dadosPorPartido = {
    labels: Object.keys(dados.porPartido),
    datasets: [
      { label: 'Sim', data: Object.values(dados.porPartido).map(p => p.sim), backgroundColor: '#34c759' },
      { label: 'Não', data: Object.values(dados.porPartido).map(p => p.nao), backgroundColor: '#ff3b30' }
    ]
  };

  return (
    <div className="graficos-page">
      <button className="back-button" onClick={onBackToHome}>
        ← Voltar para Home
      </button>

      <h1 className="graficos-title">📊 Visualização por Gráfico</h1>

      <div className="graficos-container">
        <div className="pautas-lista">
          <h3>Selecione uma pauta</h3>
          
          <input
            type="text"
            placeholder="🔎 Buscar por nome, número ou ano..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading ? (
            <p>Carregando pautas...</p>
          ) : filteredPautas.length === 0 ? (
            <p>Nenhuma pauta encontrada.</p>
          ) : (
            filteredPautas.map(p => (
              <div
                key={p.id}
                className={`pauta-item ${selectedPauta?.id === p.id ? 'active' : ''}`}
                onClick={() => carregarVotos(p)}
              >
                <strong>{p.titulo}</strong>
                <small>{p.descricao}</small>
              </div>
            ))
          )}
        </div>

        <div className="graficos-area">
          <div className="tabs">
            <button className={`tab ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}>Distribuição Geral</button>
            <button className={`tab ${activeTab === 'partido' ? 'active' : ''}`} onClick={() => setActiveTab('partido')}>Por Partido</button>
            <button className={`tab ${activeTab === 'tempo' ? 'active' : ''}`} onClick={() => setActiveTab('tempo')}>Linha do Tempo</button>
            <button className={`tab ${activeTab === 'pauta' ? 'active' : ''}`} onClick={() => setActiveTab('pauta')}>Por Pauta</button>
          </div>

          {selectedPauta ? (
            <div className="grafico-content">
              {activeTab === 'geral' && <><h4>Distribuição Geral de Votos</h4><Pie data={dadosGerais} options={{ responsive: true }} /></>}
              {activeTab === 'partido' && <><h4>Votos por Partido</h4><Bar data={dadosPorPartido} options={{ responsive: true }} /></>}
              {(activeTab === 'tempo' || activeTab === 'pauta') && (
                <div className="placeholder">
                  <h4>{activeTab === 'tempo' ? 'Linha do Tempo' : 'Votações por Pauta'}</h4>
                  <p>Em desenvolvimento...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>Selecione uma pauta à esquerda para ver os gráficos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraficosPage;