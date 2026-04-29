// src/components/RegisterForm.jsx
import PasswordInput from './PasswordInput';

const RegisterForm = ({ formData, handleChange, onSubmit, onLogin, message, isSuccessMessage }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Nome</label>
        <input type="text" name="nome" placeholder="Seu nome completo" value={formData.nome} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>E-mail</label>
        <input type="email" name="email" placeholder="seuemail@exemplo.com" value={formData.email} onChange={handleChange} required />
      </div>

      <PasswordInput
        label="Senha"
        name="senha"
        value={formData.senha}
        onChange={handleChange}
        autoComplete="new-password"
      />

      <PasswordInput
        label="Confirmar Senha"
        name="confirmarSenha"
        value={formData.confirmarSenha}
        onChange={handleChange}
        autoComplete="new-password"
      />
      
      <button type="submit" className="btn-primary">Cadastrar</button>

      {message && <p className={`message ${isSuccessMessage ? 'success' : 'error'}`}>{message}</p>}

      <div className="switch-link">
        <p>Já tem conta? <button type="button" className="link-btn" onClick={onLogin}>Entrar</button></p>
      </div>
    </form>
  );
};

export default RegisterForm;