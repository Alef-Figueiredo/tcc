// src/components/LoginForm.jsx
import PasswordInput from './PasswordInput';

const LoginForm = ({ 
  formData, 
  handleChange, 
  onSubmit, 
  onForgotPassword, 
  onRegister, 
  message, 
  isSuccessMessage, 
  onDeleteAccount 
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>E-mail</label>
        <input
          type="email"
          name="email"
          placeholder="seuemail@exemplo.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <PasswordInput
        label="Senha"
        name="senha"
        value={formData.senha}
        onChange={handleChange}
        autoComplete="current-password"
      />

      <button type="submit" className="btn-primary">Entrar</button>

      {/* ✅ Botão Excluir Minha Conta - AGORA LOGO ABAIXO DO "ENTRAR" */}
      {onDeleteAccount && (
        <button 
          type="button" 
          className="btn-danger" 
          onClick={onDeleteAccount}
          style={{ marginTop: '12px' }}
        >
          Excluir Minha Conta
        </button>
      )}

      {message && (
        <p className={`message ${isSuccessMessage ? 'success' : 'error'}`}>{message}</p>
      )}

      <div className="switch-link">
        <p>
          Não tem conta?{' '}
          <button type="button" className="link-btn" onClick={onRegister}>
            Cadastre-se
          </button>
          <br />
          <button type="button" className="link-btn" onClick={onForgotPassword}>
            Esqueci a senha
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;