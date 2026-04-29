// src/components/Home.jsx
import { useState } from 'react';
import './css/Home.css';

const Home = ({ 
  onGoToPautas, 
  onGoToGraficos, 
  onGoToDeputados, 
  onLogin,
  isLoggedIn,
  onLogout 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <div className="logo">
          <h1>ParlaData</h1>
        </div>

        {isLoggedIn ? (
         <div className="profile-container">
           <button 
                className="profile-btn"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <svg 
                    width="28" 
                    height="28" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#1a1a1a" 
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                 <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </button>

            {showDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-item" onClick={onLogout}>
                  Sair
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn-login" onClick={onLogin}>
            Entrar / Cadastrar
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="hero">
        <h1>Transparência nas votações da Câmara</h1>
        <p>Escolha como quer acompanhar as decisões dos deputados federais</p>
      </div>

      {/* Cards */}
      <div className="home-cards">
        <div className="home-card" onClick={onGoToPautas}>
          <div className="card-icon">📋</div>
          <h3>Pautas Recentes</h3>
          <p>Veja as últimas votações, ementas e quem votou o quê.</p>
          <button className="card-btn">Acessar Pautas →</button>
        </div>

        <div className="home-card" onClick={onGoToGraficos}>
          <div className="card-icon">📊</div>
          <h3>Visualização por Gráfico</h3>
          <p>Gráficos interativos: por partido, por estado, presença/ausência e mais.</p>
          <button className="card-btn">Ver Gráficos →</button>
        </div>

        <div className="home-card" onClick={onGoToDeputados}>
          <div className="card-icon">👤</div>
          <h3>Por Deputado</h3>
          <p>Busque um deputado e veja todo o histórico de votos dele.</p>
          <button className="card-btn">Buscar Deputado →</button>
        </div>
      </div>

      <div className="home-footer">
        <p>Dados oficiais da Câmara dos Deputados • Transparência para o cidadão</p>
      </div>
    </div>
  );
};

export default Home;