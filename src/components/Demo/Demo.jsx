import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/Auth/useAuth';
import Navbar from '../Navbar/Navbar';
import './Demo.css';

const Demo = () => {
  const { userData } = useAuth();
  
  const exemploLink = userData?.linkCalendario 
    ? `${window.location.origin}/calendario/${userData.linkCalendario}`
    : `${window.location.origin}/calendario/exemplo12345`;

  return (
    <div>
      <Navbar />
      <div className="demo-container">
      <div className="demo-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>🎯 Como Funciona o Sistema de Calendários</h2>
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
        
        <div className="demo-section">
          <h3>📝 Para Administradores (Você)</h3>
          <ul>
            <li>Crie sua conta como administrador de uma instituição</li>
            <li>Adicione eventos ao seu calendário</li>
            <li>Escolha se quer tornar o calendário público ou privado</li>
            <li>Se público, compartilhe o link com outras pessoas</li>
          </ul>
        </div>

        <div className="demo-section">
          <h3>👥 Para Visitantes (Sem Conta)</h3>
          <ul>
            <li>Não precisam criar conta</li>
            <li>Podem visualizar calendários públicos através do link</li>
            <li>Veem os eventos de forma somente leitura</li>
            <li>Não podem criar ou editar eventos</li>
          </ul>
        </div>

        <div className="demo-section">
          <h3>🔗 Exemplo de Link Público</h3>
          <div className="link-demo">
            <code>{exemploLink}</code>
          </div>
          <p className="demo-note">
            ☝️ Este é um exemplo de como seria o link do seu calendário público. 
            Qualquer pessoa pode acessar este link e ver os eventos, mesmo sem ter conta no sistema.
          </p>
        </div>

        <div className="demo-section">
          <h3>🔒 Privacidade e Controle</h3>
          <ul>
            <li><strong>Privado:</strong> Só você vê os eventos (padrão)</li>
            <li><strong>Público:</strong> Qualquer pessoa com o link pode ver</li>
            <li>Você pode alternar entre público/privado a qualquer momento</li>
            <li>O link é único e não pode ser adivinhado</li>
          </ul>
        </div>

        <div className="demo-actions">
          <button 
            onClick={() => window.open(exemploLink, '_blank')}
            className="demo-button"
          >
            🔗 Testar Link Público
          </button>
          <button 
            onClick={() => window.location.href = '/configuracoes'}
            className="demo-button secondary"
          >
            ⚙️ Configurar Visibilidade
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Demo;
