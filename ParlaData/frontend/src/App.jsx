// App.jsx
import { useState, useEffect } from 'react';
import './App.css';

import { useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import PautasPage from './components/PautasPage';
import PautaDetail from './components/PautaDetail';
import Home from './components/Home';
import GraficosPage from './components/GraficosPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const auth = useAuth();
  const [screen, setScreen] = useState('home');
  const [_resetToken, setResetToken] = useState('');   // ← Corrigido (underscore)
  const [selectedPauta, setSelectedPauta] = useState(null);

  // ====================== NAVEGAÇÃO ======================
  const changeScreen = (newScreen) => {
    auth.resetFormData();
    setScreen(newScreen);
  };

  // ====================== HANDLERS DA HOME (SEM FORÇAR LOGIN) ======================
  const handleGoToPautas = () => setScreen('pautas');
  const handleGoToGraficos = () => setScreen('graficos');     // futura tela
  const handleGoToDeputados = () => setScreen('deputados');   // futura tela

  const handleLoginFromHome = () => setScreen('login');

  // ====================== ABRIR DETALHES DA PAUTA ======================
  const handlePautaClick = (pauta) => {
    setSelectedPauta(pauta);
    setScreen('pauta-detail');
  };

  const handleBackToPautas = () => {
    setSelectedPauta(null);
    setScreen('pautas');
  };

  // ====================== EXCLUIR CONTA ======================
  const handleDelete = async () => {
    const { email, senha } = auth.formData;
    if (!email || !senha) return auth.setMessage?.('Preencha e-mail e senha');

    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const res = await fetch(`${API_URL}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      const data = await res.json();

      if (res.ok) {
        auth.setMessage?.('Conta excluída com sucesso!');
        setTimeout(() => auth.logout(), 1500);
      } else {
        auth.setMessage?.(data.message || 'Erro ao excluir');
      }
    } catch {
      auth.setMessage?.('Erro de conexão');
    }
  };

  // ====================== LOGOUT ======================
  const handleLogout = () => {
    auth.resetFormData();
    setResetToken('');
    setScreen('home');
    window.history.replaceState({}, document.title, '/');
    auth.logout();
  };

  // ====================== CARREGAR PAUTAS (funciona sem login) ======================
  const [pautas, setPautas] = useState([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      setLoadingPautas(true);
      try {
        const res = await fetch(`${API_URL}/api/pautas`);
        const data = await res.json();
        setPautas(data || []);
      } catch (err) {
        console.error(err);
        setPautas([]);
      } finally {
        setLoadingPautas(false);
      }
    };

    if (screen === 'pautas') carregar();
  }, [screen]);

  // ====================== RENDERIZAÇÃO ======================

  if (screen === 'pauta-detail' && selectedPauta) {
    return <PautaDetail pauta={selectedPauta} onBack={handleBackToPautas} />;
  }

 if (screen === 'pautas') {
  return (
    <PautasPage 
      pautas={pautas} 
      loadingPautas={loadingPautas} 
      onPautaClick={handlePautaClick} 
      onLogout={auth.isLoggedIn ? handleLogout : null}
      onBackToHome={() => setScreen('home')}
    />
  );
}

  if (screen === 'graficos') {
    return <GraficosPage onBackToHome={() => setScreen('home')} />;
  }

  if (screen === 'home') {
  return (
    <Home 
      onGoToPautas={handleGoToPautas}
      onGoToGraficos={handleGoToGraficos}
      onGoToDeputados={handleGoToDeputados}
      onLogin={handleLoginFromHome}
      isLoggedIn={auth.isLoggedIn}
      currentUser={auth.currentUser}
      onLogout={handleLogout}
    />
  );
}

  // Telas de autenticação
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>
          {screen === 'reset' ? 'Redefinir Senha' :
           screen === 'forgot' ? 'Esqueci minha senha' :
           screen === 'register' ? 'Criar conta' : 'Bem-vindo'}
        </h1>
        <p>
          {screen === 'reset' ? 'Digite sua nova senha' :
           screen === 'forgot' ? 'Digite seu e-mail para receber o link' :
           screen === 'register' ? 'Preencha os dados abaixo' : 'Entre com suas credenciais'}
        </p>

        {screen === 'login' && (
          <LoginForm
            formData={auth.formData}
            handleChange={auth.handleChange}
            onSubmit={(e) => { 
              e.preventDefault(); 
              auth.login(auth.formData.email, auth.formData.senha)
                .then(success => success && setScreen('home'));
            }}
            onForgotPassword={() => changeScreen('forgot')}
            onRegister={() => changeScreen('register')}
            message={auth.message}
            isSuccessMessage={auth.isSuccessMessage}
            onDeleteAccount={handleDelete}     
          />
        )}

        {screen === 'register' && (
          <RegisterForm
            formData={auth.formData}
            handleChange={auth.handleChange}
            onSubmit={(e) => {
              e.preventDefault();
              if (auth.formData.senha !== auth.formData.confirmarSenha) {
                auth.setMessage?.('As senhas não coincidem!');
                return;
              }
              if (auth.formData.senha.length < 6) {
                auth.setMessage?.('Senha deve ter pelo menos 6 caracteres');
                return;
              }
              auth.register(auth.formData.nome, auth.formData.email, auth.formData.senha)
                .then(success => success && changeScreen('login'));
            }}
            onLogin={() => changeScreen('login')}
            message={auth.message}
            isSuccessMessage={auth.isSuccessMessage}
          />
        )}

        {screen === 'forgot' && (
          <ForgotPasswordForm
            formData={auth.formData}
            handleChange={auth.handleChange}
            onSubmit={(e) => {
              e.preventDefault();
              auth.forgotPassword(auth.formData.email)
                .then(success => success && setTimeout(() => changeScreen('login'), 2800));
            }}
            onBack={() => changeScreen('login')}
            message={auth.message}
            isSuccessMessage={auth.isSuccessMessage}
            loading={auth.loadingForgot}
          />
        )}

        {screen === 'reset' && (
          <ResetPasswordForm
            formData={auth.formData}
            handleChange={auth.handleChange}
            onSubmit={(e) => {
              e.preventDefault();
              if (auth.formData.novaSenha !== auth.formData.confirmarNovaSenha) {
                auth.setMessage?.('As senhas não coincidem!');
                return;
              }
              if (auth.formData.novaSenha.length < 6) {
                auth.setMessage?.('Senha deve ter pelo menos 6 caracteres');
                return;
              }
              auth.resetPassword(_resetToken, auth.formData.novaSenha)   // ← usa _resetToken
                .then(success => success && setTimeout(() => changeScreen('home'), 2000));
            }}
            onBack={() => changeScreen('login')}
            message={auth.message}
            isSuccessMessage={auth.isSuccessMessage}
          />
        )}
      </div>
    </div>
  );
}

export default App;