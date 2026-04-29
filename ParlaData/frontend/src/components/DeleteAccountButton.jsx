// src/components/DeleteAccountButton.jsx

const DeleteAccountButton = ({ formData, handleDeleteAccount }) => {
  return (
    <button 
      className="btn-danger" 
      onClick={handleDeleteAccount}
      style={{ marginTop: '12px', width: '100%' }}
    >
      Excluir Minha Conta
    </button>
  );
};

export default DeleteAccountButton;