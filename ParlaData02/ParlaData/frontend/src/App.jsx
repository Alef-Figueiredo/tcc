import { useState, useEffect } from 'react';
import './App.css';

// ====================== URL DA API (Docker + Desenvolvimento) ======================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [message, setMessage] = useState('');

  // Estados dos olhos das senhas
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarNovaSenha, setShowConfirmarNovaSenha] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Detecta token na URL para reset de senha
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setIsResetPassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }
  }, []);

  // Limpa formulário quando troca de tela
  useEffect(() => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      novaSenha: '',
      confirmarNovaSenha: '',
    });
    setMessage('');
    setShowSenha(false);
    setShowConfirmarSenha(false);
    setShowNovaSenha(false);
    setShowConfirmarNovaSenha(false);
  }, [isLogin, isForgotPassword, isResetPassword]);

  // ====================== LOGIN ======================
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data.nome || formData.email);
        setIsLoggedIn(true);
      } else {
        setMessage(data.message || 'Credenciais inválidas');
      }
    } catch (err) {
      setMessage('Erro de conexão com o servidor');
    }
  };

  // ====================== LOGOUT ======================
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsLogin(true);
  };

  // ====================== ESQUECI A SENHA ======================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setMessage(data.message || 'Link enviado com sucesso!');
      if (res.ok) setTimeout(() => setIsForgotPassword(false), 2500);
    } catch (err) {
      setMessage('Erro de conexão com o servidor');
    }
  };

  // ====================== REDEFINIR SENHA ======================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.novaSenha !== formData.confirmarNovaSenha) {
      return setMessage('As senhas não coincidem');
    }
    if (formData.novaSenha.length < 6) {
      return setMessage('A senha deve ter pelo menos 6 caracteres');
    }

    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, novaSenha: formData.novaSenha }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Senha alterada com sucesso! Faça login.');
        setTimeout(() => {
          setIsResetPassword(false);
          setIsLogin(true);
          window.history.replaceState({}, '', '/');
        }, 2000);
      } else {
        setMessage(data.message || 'Erro ao redefinir senha');
      }
    } catch (err) {
      setMessage('Erro de conexão com o servidor');
    }
  };

  // ====================== CADASTRO ======================
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setMessage('');

    if (formData.senha !== formData.confirmarSenha) {
      return setMessage('As senhas não coincidem');
    }
    if (formData.senha.length < 6) {
      return setMessage('A senha deve ter pelo menos 6 caracteres');
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Conta criada com sucesso! Faça login.');
        setIsLogin(true);
      } else {
        setMessage(data.message || 'Erro ao cadastrar');
      }
    } catch (err) {
      setMessage('Erro de conexão');
    }
  };

  // ====================== EXCLUIR CONTA ======================
  const handleDeleteAccount = async () => {
    if (!formData.email.trim() || !formData.senha.trim()) {
      setMessage('Preencha e-mail e senha para excluir');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta conta? Isso não pode ser desfeito.')) return;

    try {
      const res = await fetch(`${API_URL}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          senha: formData.senha,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Conta excluída com sucesso!');
        setFormData({ ...formData, email: '', senha: '' });
      } else {
        setMessage(data.message || 'Erro ao excluir conta');
      }
    } catch (err) {
      setMessage('Erro de conexão com o servidor');
    }
  };

  const isSuccessMessage = message.toLowerCase().includes('sucesso') ||
                           message.toLowerCase().includes('enviado') ||
                           message.toLowerCase().includes('alterada') ||
                           message.toLowerCase().includes('bem-vindo');

  // ==================== ESTADO DAS PAUTAS ====================
  const [pautas, setPautas] = useState([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      carregarPautas();
    }
  }, [isLoggedIn]);

  const carregarPautas = async () => {
    setLoadingPautas(true);
    try {
      const res = await fetch(`${API_URL}/api/pautas`);
      if (!res.ok) throw new Error('Erro na API');
      
      const data = await res.json();
      setPautas(data);
      console.log('✅ Pautas carregadas:', data);
    } catch (err) {
      console.error('Erro ao carregar pautas:', err);
      alert('Erro ao carregar pautas do servidor. Usando dados de teste.');
      setPautas([
        { id: 1, status: 'Aprovada', cor: 'aprovada', titulo: 'PL 2547/2024 - Reforma Tributária', descricao: 'Proposta de alteração no sistema tributário...', data: '14/03/2024', area: 'Economia' },
        { id: 2, status: 'Em Andamento', cor: 'andamento', titulo: 'PEC 45/2023 - Educação Digital', descricao: 'Inclusão de educação digital...', data: '09/03/2024', area: 'Educação' },
        { id: 3, status: 'Rejeitada', cor: 'rejeitada', titulo: 'PL 1823/2024 - Meio Ambiente', descricao: 'Regulamentação de práticas sustentáveis...', data: '07/03/2024', area: 'Meio Ambiente' }
      ]);
    } finally {
      setLoadingPautas(false);
    }
  };

  // ====================== SE ESTIVER LOGADO → MOSTRA PAUTAS ======================
  if (isLoggedIn) {
    return (
      <div className="pautas-page">
        <div className="pautas-header">
          <h1>Pautas Disponíveis</h1>
          <p>Selecione uma pauta para visualizar todas as votações relacionadas</p>
        </div>

        {loadingPautas ? (
          <p style={{ textAlign: 'center', marginTop: '80px', fontSize: '18px' }}>
            Carregando pautas...
          </p>
        ) : (
          <div className="pautas-grid">
            {pautas.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '50px' }}>
                Nenhuma pauta encontrada.
              </p>
            ) : (
              pautas.map(pauta => (
                <div key={pauta.id} className="pauta-card">
                  <span className={`status-badge status-${pauta.cor}`}>
                    {pauta.status}
                  </span>
                  <h3>{pauta.titulo}</h3>
                  <p className="descricao">{pauta.descricao}</p>
                  <div className="pauta-info">
                    <span>📅 {pauta.data}</span>
                    <span>🏷️ {pauta.area}</span>
                    <span className="arrow">→</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button className="logout-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  // ====================== TELA DE LOGIN / CADASTRO ======================
  return (
    <div className="login-container">
      <div className="login-box">
        <h1>
          {isResetPassword ? 'Redefinir Senha' :
           isForgotPassword ? 'Esqueci minha senha' :
           isLogin ? 'Bem-vindo' : 'Criar conta'}
        </h1>
        <p>
          {isResetPassword ? 'Digite sua nova senha' :
           isForgotPassword ? 'Digite seu e-mail para receber o link' :
           isLogin ? 'Entre com suas credenciais' : 'Preencha os dados abaixo'}
        </p>

        <form
          onSubmit={
            isResetPassword ? handleResetPassword :
            isForgotPassword ? handleForgotPassword :
            isLogin ? handleLogin : handleCreateAccount
          }
        >
          {/* CADASTRO */}
          {!isLogin && !isForgotPassword && !isResetPassword && (
            <>
              <div className="form-group">
                <label>Nome</label>
                <input type="text" name="nome" placeholder="Seu nome completo" value={formData.nome} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" name="email" placeholder="seuemail@exemplo.com" value={formData.email} onChange={handleChange} required />
              </div>
            </>
          )}

          {/* E-mail no login */}
          {isLogin && !isForgotPassword && !isResetPassword && (
            <div className="form-group">
              <label>E-mail</label>
              <input type="email" name="email" placeholder="seuemail@exemplo.com" value={formData.email} onChange={handleChange} required />
            </div>
          )}

          {/* Senha - Login */}
          {isLogin && !isForgotPassword && !isResetPassword && (
            <div className="form-group password-wrapper">
              <label>Senha</label>
              <div className="password-wrapper">
                <input
                  type={showSenha ? 'text' : 'password'}
                  name="senha"
                  placeholder="Digite sua senha"
                  value={formData.senha}
                  onChange={handleChange}
                  required
                />
                {formData.senha && (
                  <button type="button" className="eye-btn" onClick={() => setShowSenha(!showSenha)}>
                    {showSenha ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 2l20 20" />
                        <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                        <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                        <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Senha + Confirmar - Cadastro */}
          {!isLogin && !isForgotPassword && !isResetPassword && (
            <>
              {/* Senha Cadastro */}
              <div className="form-group password-wrapper">
                <label>Senha</label>
                <div className="password-wrapper">
                  <input type={showSenha ? 'text' : 'password'} name="senha" placeholder="Digite sua senha" value={formData.senha} onChange={handleChange} required />
                  {formData.senha && (
                    <button type="button" className="eye-btn" onClick={() => setShowSenha(!showSenha)}>
                      {showSenha ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 2l20 20" />
                          <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                          <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                          <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmar Senha Cadastro */}
              <div className="form-group password-wrapper">
                <label>Confirmar Senha</label>
                <div className="password-wrapper">
                  <input type={showConfirmarSenha ? 'text' : 'password'} name="confirmarSenha" placeholder="Confirme sua senha" value={formData.confirmarSenha} onChange={handleChange} required />
                  {formData.confirmarSenha && (
                    <button type="button" className="eye-btn" onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}>
                      {showConfirmarSenha ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 2l20 20" />
                          <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                          <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                          <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Reset de Senha */}
          {isResetPassword && (
            <>
              <div className="form-group password-wrapper">
                <label>Nova Senha</label>
                <div className="password-wrapper">
                  <input type={showNovaSenha ? 'text' : 'password'} name="novaSenha" placeholder="Digite a nova senha" value={formData.novaSenha} onChange={handleChange} required />
                  {formData.novaSenha && (
                    <button type="button" className="eye-btn" onClick={() => setShowNovaSenha(!showNovaSenha)}>
                      {showNovaSenha ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 2l20 20" />
                          <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                          <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                          <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group password-wrapper">
                <label>Confirmar Nova Senha</label>
                <div className="password-wrapper">
                  <input type={showConfirmarNovaSenha ? 'text' : 'password'} name="confirmarNovaSenha" placeholder="Confirme a nova senha" value={formData.confirmarNovaSenha} onChange={handleChange} required />
                  {formData.confirmarNovaSenha && (
                    <button type="button" className="eye-btn" onClick={() => setShowConfirmarNovaSenha(!showConfirmarNovaSenha)}>
                      {showConfirmarNovaSenha ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 2l20 20" />
                          <path d="M6.712 6.72C3.664 8.126 2 12 2 12s3.5 7 10 7c2.45 0 4.5-.78 6.088-1.712" />
                          <path d="M9.01 9.02a3 3 0 0 0 4.982 4.982" />
                          <path d="M17.288 17.3C19.5 15.5 22 12 22 12s-3.5-7-10-7c-1.88 0-3.5.45-4.712.95" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary">
            {isResetPassword ? 'Alterar Senha' :
             isForgotPassword ? 'Enviar link' :
             isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {isLogin && !isForgotPassword && !isResetPassword && (
          <button className="btn-danger" onClick={handleDeleteAccount}>
            Excluir Minha Conta
          </button>
        )}

        {message && (
          <p className={`message ${isSuccessMessage ? 'success' : 'error'}`}>
            {message}
          </p>
        )}

        <div className="switch-link">
          {isResetPassword ? (
            <button type="button" className="link-btn" onClick={() => { setIsResetPassword(false); setIsLogin(true); }}>
              ← Voltar
            </button>
          ) : isForgotPassword ? (
            <button type="button" className="link-btn" onClick={() => setIsForgotPassword(false)}>
              ← Voltar para o login
            </button>
          ) : isLogin ? (
            <p>
              Não tem conta?{' '}
              <button type="button" className="link-btn" onClick={() => setIsLogin(false)}>
                Cadastre-se
              </button>{' '}
              ou{' '}
              <button type="button" className="link-btn" onClick={() => setIsForgotPassword(true)}>
                esqueci a senha
              </button>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <button type="button" className="link-btn" onClick={() => setIsLogin(true)}>
                Entrar
              </button>
            </p>
          )}
        </div>

        <p className="terms">
          Ao continuar, você concorda com nossos{' '}
          <a href="#">Termos de Uso</a> e <a href="#">Política de Privacidade</a>
        </p>
      </div>
    </div>
  );
}

export default App;