// src/components/PautasPage.jsx
const PautasPage = ({ pautas, loadingPautas, onPautaClick, onLogout, onBackToHome }) => {
  return (
    <div className="pautas-page">
      <div className="pautas-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            className="back-button" 
            onClick={onBackToHome}
            style={{ padding: '10px 20px' }}
          >
            ← Voltar para Home
          </button>

          {onLogout && (
            <button className="logout-btn" onClick={onLogout}>
              Sair
            </button>
          )}
        </div>

        <h1>Pautas Disponíveis</h1>
        <p>Selecione uma pauta para visualizar todas as votações relacionadas</p>
      </div>

      {loadingPautas ? (
        <p style={{ textAlign: 'center', marginTop: '80px', fontSize: '18px' }}>
          Carregando pautas...
        </p>
      ) : !pautas || !Array.isArray(pautas) || pautas.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#666' }}>
          Nenhuma pauta disponível no momento.<br />
          Tente atualizar a página.
        </p>
      ) : (
        <div className="pautas-grid">
          {pautas.map((pauta) => (
            <div 
              key={pauta.id} 
              className="pauta-card"
              onClick={() => onPautaClick(pauta)}
              style={{ cursor: 'pointer' }}
            >
              <span className={`status-badge status-${pauta.cor || 'andamento'}`}>
                {pauta.status || 'Em Andamento'}
              </span>
              <h3>{pauta.titulo}</h3>
              <p className="descricao">{pauta.descricao}</p>
              <div className="pauta-info">
                <span>📅 {pauta.data}</span>
                <span>🏷️ {pauta.area}</span>
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PautasPage;