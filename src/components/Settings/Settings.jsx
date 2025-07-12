import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/Auth/useAuth';
import { atualizarVisibilidade } from '../../hooks/FireBase/firebaseconfig';
import AccountManager from './AccountManager';
import './Settings.css';

const Settings = () => {
  const { user, userData, logout } = useAuth();
  const [isPublic, setIsPublic] = useState(userData?.calendarioPublico || false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeSection, setActiveSection] = useState('calendar');

  const handleVisibilityChange = async (e) => {
    const newVisibility = e.target.checked;
    setLoading(true);
    setMessage('');
    
    try {
      await atualizarVisibilidade(user.uid, newVisibility);
      setIsPublic(newVisibility);
      setMessage('Configuração atualizada com sucesso!');
    } catch (error) {
      setMessage('Erro ao atualizar configuração. Tente novamente.');
      console.error('Erro ao atualizar visibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCalendarLink = () => {
    const link = `${window.location.origin}/calendario/${userData?.linkCalendario}`;
    navigator.clipboard.writeText(link).then(() => {
      setMessage('Link copiado para a área de transferência!');
    }).catch(() => {
      setMessage('Erro ao copiar link. Tente novamente.');
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Configurações</h2>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              ← Voltar ao Calendário
            </button>
          </Link>
        </div>

        {/* Navegação entre seções */}
        <div className="settings-navigation">
          <button 
            className={`nav-button ${activeSection === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveSection('calendar')}
          >
            📅 Calendário
          </button>
          <button 
            className={`nav-button ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSection('account')}
          >
            👤 Conta
          </button>
        </div>

        {activeSection === 'calendar' && (
          <div className="calendar-settings">
            <div className="user-info">
              <h3>Informações do Usuário</h3>
              <p><strong>Nome:</strong> {userData?.nome}</p>
              <p><strong>Email:</strong> {userData?.email}</p>
              <p><strong>Instituição:</strong> {userData?.instituicao}</p>
            </div>

            <div className="visibility-section">
              <h3>Visibilidade do Calendário</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={handleVisibilityChange}
                    disabled={loading}
                  />
                  Tornar calendário público
                </label>
              </div>
              <p className="visibility-description">
                {isPublic 
                  ? 'Seu calendário está público e pode ser visualizado por qualquer pessoa com o link (mesmo sem ter conta no sistema).'
                  : 'Seu calendário está privado e só pode ser visualizado por você quando estiver logado.'
                }
              </p>
            </div>

            {isPublic && (
              <div className="link-section">
                <h3>Link do Calendário Público</h3>
                <div className="link-input-group">
                  <input
                    type="text"
                    value={`${window.location.origin}/calendario/${userData?.linkCalendario}`}
                    readOnly
                    className="link-input"
                  />
                  <button 
                    onClick={copyCalendarLink}
                    className="copy-button"
                  >
                    Copiar Link
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('Erro') ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="logout-section">
              <button onClick={handleLogout} className="logout-button">
                Sair da Conta
              </button>
            </div>
          </div>
        )}

        {activeSection === 'account' && (
          <AccountManager />
        )}
      </div>
    </div>
  );
};

export default Settings;
