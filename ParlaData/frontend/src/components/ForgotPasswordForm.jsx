// src/components/ForgotPasswordForm.jsx

const ForgotPasswordForm = ({ formData, handleChange, onSubmit, onBack, message, isSuccessMessage, loading }) => {
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
          autoFocus
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </button>

      {message && (
        <p className={`message ${isSuccessMessage ? 'success' : 'error'}`}>{message}</p>
      )}

      <div className="switch-link">
        <button type="button" className="link-btn" onClick={onBack}>← Voltar para o login</button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;