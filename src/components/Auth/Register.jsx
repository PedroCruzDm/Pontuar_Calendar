import React, { useState } from 'react';
import { useAuth } from '../../hooks/Auth/useAuth';
import './Auth.css';

const Register = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    instituicao: '',
    calendarioPublico: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.email || !formData.password || !formData.instituicao) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await signup({
        nome: formData.nome,
        email: formData.email,
        password: formData.password,
        instituicao: formData.instituicao,
        calendarioPublico: formData.calendarioPublico,
        tipo: 'admin'
      });
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/operation-not-allowed':
        return 'Operação não permitida';
      case 'auth/weak-password':
        return 'Senha muito fraca';
      default:
        return 'Erro ao criar conta. Tente novamente';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Criar Conta de Administrador</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome Completo:*</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="instituicao">Instituição/Empresa:*</label>
            <input
              type="text"
              id="instituicao"
              name="instituicao"
              value={formData.instituicao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha:*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha:*</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label htmlFor="calendarioPublico" className="checkbox-label">
              <input
                type="checkbox"
                id="calendarioPublico"
                name="calendarioPublico"
                checked={formData.calendarioPublico}
                onChange={handleChange}
              />
              Tornar calendário público (outros usuários poderão visualizar com o link)
            </label>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="auth-toggle">
          <p>Já tem uma conta? 
            <button type="button" onClick={onToggleMode} className="link-button">
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
