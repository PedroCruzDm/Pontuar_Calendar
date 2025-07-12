import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/Auth/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <h1>Sistema de Calendário</h1>
          </Link>
        </div>
        
        <div className="navbar-right">
          <div className="navbar-user-info">
            <span className="user-greeting">
              Olá, {userData?.nome || 'Usuário'}
            </span>
            <span className="user-institution">
              {userData?.instituicao}
            </span>
          </div>
          
          <div className="navbar-actions">
            <Link to="/demo" className="navbar-demo-button">
              🎯 Como Funciona
            </Link>
            <Link to="/configuracoes" className="settings-button">
              ⚙️ Configurações
            </Link>
            <button 
              className="logout-button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
