import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/Auth/useAuth';
import { 
  atualizarUsuario, 
  atualizarSenha, 
  deletarConta, 
  reautenticarUsuario 
} from '../../hooks/FireBase/firebaseconfig';
import './AccountManager.css';

const AccountManager = () => {
  const { user, userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estados para atualização de perfil
  const [profileData, setProfileData] = useState({
    nome: '',
    instituicao: ''
  });

  // Estados para mudança de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados para deletar conta
  const [deleteData, setDeleteData] = useState({
    email: '',
    password: '',
    confirmDelete: ''
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        nome: userData.nome || '',
        instituicao: userData.instituicao || ''
      });
    }
  }, [userData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!profileData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      await atualizarUsuario(user.uid, {
        nome: profileData.nome,
        instituicao: profileData.instituicao
      });

      setMessage('Perfil atualizado com sucesso!');
      // Recarregar dados do usuário
      window.location.reload();
    } catch (error) {
      setMessage(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres');
      }

      // Primeiro reautenticar
      await reautenticarUsuario(user.email, passwordData.currentPassword);
      
      // Depois atualizar senha
      await atualizarSenha(passwordData.newPassword);

      setMessage('Senha atualizada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setMessage('Senha atual incorreta');
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage('Por favor, faça login novamente e tente outra vez');
      } else {
        setMessage(`Erro ao atualizar senha: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (deleteData.confirmDelete !== 'DELETAR CONTA') {
        throw new Error('Digite exatamente "DELETAR CONTA" para confirmar');
      }

      if (deleteData.email !== user.email) {
        throw new Error('Email não confere com a conta logada');
      }

      await deletarConta(deleteData.email, deleteData.password);
      
      setMessage('Conta deletada com sucesso. Redirecionando...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setMessage('Senha incorreta');
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage('Por favor, faça login novamente e tente outra vez');
      } else {
        setMessage(`Erro ao deletar conta: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage('');
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'password', label: 'Senha', icon: '🔒' },
    { id: 'delete', label: 'Deletar Conta', icon: '🗑️' }
  ];

  return (
    <div className="account-manager">
      <div className="account-manager-header">
        <h2>Gerenciar Conta</h2>
        <p>Atualize seus dados pessoais, altere sua senha ou delete sua conta</p>
      </div>

      <div className="account-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              clearMessage();
            }}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`account-message ${message.includes('Erro') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="account-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h3>Informações do Perfil</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="nome">Nome completo</label>
                <input
                  type="text"
                  id="nome"
                  value={profileData.nome}
                  onChange={(e) => setProfileData({...profileData, nome: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="instituicao">Instituição</label>
                <input
                  type="text"
                  id="instituicao"
                  value={profileData.instituicao}
                  onChange={(e) => setProfileData({...profileData, instituicao: e.target.value})}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                />
                <small>O email não pode ser alterado</small>
              </div>

              <button type="submit" className="update-button" disabled={loading}>
                {loading ? 'Atualizando...' : 'Atualizar Perfil'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="password-section">
            <h3>Alterar Senha</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="currentPassword">Senha atual</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Nova senha</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <small>Mínimo 6 caracteres</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar nova senha</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="update-button" disabled={loading}>
                {loading ? 'Atualizando...' : 'Alterar Senha'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'delete' && (
          <div className="delete-section">
            <h3>Deletar Conta</h3>
            <div className="warning-box">
              <p>⚠️ <strong>Atenção:</strong> Esta ação é irreversível!</p>
              <p>Ao deletar sua conta, todos os seus dados serão permanentemente removidos:</p>
              <ul>
                <li>Todos os eventos do seu calendário</li>
                <li>Configurações personalizadas</li>
                <li>Tipos de eventos personalizados</li>
                <li>Configurações de cabeçalho</li>
                <li>Sua conta de usuário</li>
              </ul>
            </div>

            {!showDeleteConfirm ? (
              <button 
                className="danger-button"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Quero deletar minha conta
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount}>
                <div className="form-group">
                  <label htmlFor="deleteEmail">Confirme seu email</label>
                  <input
                    type="email"
                    id="deleteEmail"
                    value={deleteData.email}
                    onChange={(e) => setDeleteData({...deleteData, email: e.target.value})}
                    required
                    disabled={loading}
                    placeholder={user?.email}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deletePassword">Confirme sua senha</label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deleteData.password}
                    onChange={(e) => setDeleteData({...deleteData, password: e.target.value})}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmDelete">
                    Digite exatamente "DELETAR CONTA" para confirmar
                  </label>
                  <input
                    type="text"
                    id="confirmDelete"
                    value={deleteData.confirmDelete}
                    onChange={(e) => setDeleteData({...deleteData, confirmDelete: e.target.value})}
                    required
                    disabled={loading}
                    placeholder="DELETAR CONTA"
                  />
                </div>

                <div className="delete-buttons">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteData({ email: '', password: '', confirmDelete: '' });
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="delete-button"
                    disabled={loading}
                  >
                    {loading ? 'Deletando...' : 'Deletar Conta Definitivamente'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManager;
