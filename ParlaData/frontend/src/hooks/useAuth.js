// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingForgot, setLoadingForgot] = useState(false);

  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    novaSenha: '', confirmarNovaSenha: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Persistência de login (F5 não desloga mais)
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');     
    const savedUser = sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(savedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const isSuccessMessage = message.toLowerCase().includes('sucesso') ||
                           message.toLowerCase().includes('enviado') ||
                           message.toLowerCase().includes('alterada');

  // ====================== LOGIN ======================
  const login = async (email, senha) => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      const data = await res.json();

      if (res.ok) {
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('user', data.nome || email);
        setToken(data.token);
        setCurrentUser(data.nome || email);
        setIsLoggedIn(true);
        return true;
      } else {
        setMessage(data.message || 'Credenciais inválidas');
        return false;
      }
    } catch (err) {
      setMessage('Erro de conexão com o servidor');
      return false;
    }
  };

  // ====================== CADASTRO ======================
  const register = async (nome, email, senha) => {
    setMessage('');
    if (senha.length < 6) return setMessage('Senha deve ter pelo menos 6 caracteres');

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim().toLowerCase(), senha }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Conta criada com sucesso! Faça login.');
        return true;
      } else {
        setMessage(data.message || 'Erro ao cadastrar');
        return false;
      }
    } catch (err) {
      setMessage('Erro de conexão');
      return false;
    }
  };

  // ====================== ESQUECI A SENHA ======================
  const forgotPassword = async (email) => {
    setMessage('');
    setLoadingForgot(true);
    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setMessage(res.ok ? '✅ Link enviado! Verifique seu e-mail.' : data.message);
      return res.ok;
    } catch (err) {
      setMessage('Erro de conexão');
      return false;
    } finally {
      setLoadingForgot(false);
    }
  };

  // ====================== RESET SENHA ======================
  const resetPassword = async (resetToken, novaSenha) => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, novaSenha }),
      });
      const data = await res.json();
      setMessage(res.ok ? 'Senha alterada com sucesso!' : data.message);
      return res.ok;
    } catch (err) {
      setMessage('Erro de conexão');
      return false;
    }
  };

  const logout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setToken(null);
    setCurrentUser(null);
    setMessage('');
  };


 const resetFormData = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      confirmarSenha: '',
      novaSenha: '',
      confirmarNovaSenha: '',
    });
    setMessage('');           
  };

  return {
    isLoggedIn,
    currentUser,
    token,
    message,
    isSuccessMessage,
    loadingForgot,
    formData,
    handleChange,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    clearMessage: () => setMessage(''),
    resetFormData,
  };
};