// src/components/ResetPasswordForm.jsx
import PasswordInput from './PasswordInput';

const ResetPasswordForm = ({ 
  formData, 
  handleChange, 
  onSubmit, 
  onBack, 
  message, 
  isSuccessMessage 
}) => {
  return (
    <form onSubmit={onSubmit}>
      <PasswordInput 
        label="Nova Senha" 
        name="novaSenha" 
        value={formData.novaSenha} 
        onChange={handleChange}
        autoComplete="new-password"
      />
      <PasswordInput 
        label="Confirmar Nova Senha" 
        name="confirmarNovaSenha" 
        value={formData.confirmarNovaSenha} 
        onChange={handleChange}
        autoComplete="new-password"
      />

      <button type="submit" className="btn-primary">Alterar Senha</button>

      {message && <p className={`message ${isSuccessMessage ? 'success' : 'error'}`}>{message}</p>}

      <div className="switch-link">
        <button type="button" className="link-btn" onClick={onBack}>← Voltar</button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;