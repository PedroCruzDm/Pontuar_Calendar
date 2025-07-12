import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/Auth/useAuth';
import { obterConfiguracaoHeader, salvarConfiguracaoHeader } from '../../hooks/FireBase/firebaseconfig';
import CustomizableHeader from '../CustomizableHeader/CustomizableHeader';
import EventTypesManager from '../EventTypesManager/EventTypesManager';
import './HeaderEditor.css';

const HeaderEditor = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState({
    titulo: "Meu Calendário",
    subtitulo: "Organize seus eventos e compromissos",
    informacoes: "Configure suas informações personalizadas aqui",
    logos: [],
    tabelaTitulo: "Categorias",
    tabelaItens: [],
    corFundo: "#667eea",
    corTexto: "#ffffff",
    mostrarTabela: false,
    mostrarLogos: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error' (é true e false que nem tem em Lua)
  const [novoItem, setNovoItem] = useState('');
  const [novoLogo, setNovoLogo] = useState({ url: '', alt: '' });
  const [showEventTypesManager, setShowEventTypesManager] = useState(false);

  useEffect(() => {
    const carregarConfiguracao = async () => {
      if (user) {
        try {
          const configuracao = await obterConfiguracaoHeader(user.uid); // busca a config pelo UID do user :)
          if (configuracao) {
            setConfig(configuracao);
          }
        } catch (error) {
          console.error('Erro ao carregar configuração:', error); // v.1.01
        } finally {
          setLoading(false);
        }
      }
    };

    carregarConfiguracao();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await salvarConfiguracaoHeader(user.uid, config);
      setMessage('Configurações salvas com sucesso!');
      setMessageType('success');
      
      // Chama o callback para atualizar o header em tempo real
      if (onSave) {
        onSave(config);
      }
      
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('Erro ao salvar configurações. Tente novamente.');
      setMessageType('error');
      console.error('Erro ao salvar:', error);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    const newConfig = {
      ...config,
      [field]: value
    };
    setConfig(newConfig);
  };

  const adicionarItem = () => {
    if (novoItem.trim()) {
      setConfig(prev => ({
        ...prev,
        tabelaItens: [...prev.tabelaItens, novoItem.trim()]
      }));
      setNovoItem('');
    }
  };

  const removerItem = (index) => {
    setConfig(prev => ({
      ...prev,
      tabelaItens: prev.tabelaItens.filter((_, i) => i !== index)
    }));
  };

  const adicionarLogo = () => {
    if (novoLogo.url.trim()) {
      setConfig(prev => ({
        ...prev,
        logos: [...prev.logos, { ...novoLogo }]
      }));
      setNovoLogo({ url: '', alt: '' });
    }
  };

  const removerLogo = (index) => {
    setConfig(prev => ({
      ...prev,
      logos: prev.logos.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="header-editor-loading">
        <div className="spinner"></div>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="header-editor-overlay">
      <div className="header-editor-container">
        <div className="header-editor-header">
          <h2>🔧 Editor de Cabeçalho Personalizado</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="header-editor-content">
          <div className="editor-section">
            <h3>📝 Informações Básicas</h3>
            
            <div className="input-group">
              <label>Título Principal:</label>
              <input
                type="text"
                value={config.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: Calendário Corporativo 2025"
              />
            </div>

            <div className="input-group">
              <label>Subtítulo:</label>
              <input
                type="text"
                value={config.subtitulo}
                onChange={(e) => handleInputChange('subtitulo', e.target.value)}
                placeholder="Ex: Sua Empresa - Matriz São Paulo"
              />
            </div>

            <div className="input-group">
              <label>Informações Detalhadas:</label>
              <input
                type="text"
                value={config.informacoes}
                onChange={(e) => handleInputChange('informacoes', e.target.value)}
                placeholder="Ex: Departamento: RH | Setor: Treinamentos | Cidade: São Paulo"
              />
            </div>
          </div>

          <div className="editor-section">
            <h3>🎨 Cores e Aparência</h3>
            
            <div className="color-group">
              <div className="input-group">
                <label>Cor de Fundo:</label>
                <input
                  type="color"
                  value={config.corFundo}
                  onChange={(e) => handleInputChange('corFundo', e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Cor do Texto:</label>
                <input
                  type="color"
                  value={config.corTexto}
                  onChange={(e) => handleInputChange('corTexto', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="editor-section">
            <h3>🖼️ Logos</h3>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.mostrarLogos}
                  onChange={(e) => handleInputChange('mostrarLogos', e.target.checked)}
                  className='checkbox-input'
                />
                Mostrar Logos
              </label>
            </div>

            {config.mostrarLogos && (
              <div className="logos-section">
                <div className="add-logo-form">
                  <input
                    type="text"
                    value={novoLogo.url}
                    onChange={(e) => setNovoLogo({...novoLogo, url: e.target.value})}
                    placeholder="URL da imagem (ex: /images/logo.png)"
                  />
                  <input
                    type="text"
                    value={novoLogo.alt}
                    onChange={(e) => setNovoLogo({...novoLogo, alt: e.target.value})}
                    placeholder="Texto alternativo"
                  />
                  <button onClick={adicionarLogo} className="add-button">+ Adicionar</button>
                </div>

                <div className="logos-list">
                  {config.logos.map((logo, index) => (
                    <div key={index} className="logo-item">
                      <img 
                        src={logo.url.startsWith('/') ? process.env.PUBLIC_URL + logo.url : logo.url} 
                        alt={logo.alt}
                        className="logo-preview"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGM0YzIi8+CjxwYXRoIGQ9Ik0yMCAyMEMyMiAyMCAyNCAyMiAyNCAyNEMyNCAyNiAyMiAyOCAyMCAyOEMxOCAyOCAxNiAyNiAxNiAyNEMxNiAyMiAxOCAyMCAyMCAyMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+';
                        }}
                      />
                      <div className="logo-info">
                        <span>{logo.alt || 'Logo'}</span>
                        <small>{logo.url}</small>
                      </div>
                      <button 
                        onClick={() => removerLogo(index)}
                        className="remove-button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="editor-section">
            <h3>📊 Tabela Personalizada</h3>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={config.mostrarTabela}
                  onChange={(e) => handleInputChange('mostrarTabela', e.target.checked)}
                />
                Mostrar Tabela
              </label>
            </div>

            {config.mostrarTabela && (
              <div className="table-section">
                <div className="input-group">
                  <label>Título da Tabela:</label>
                  <input
                    type="text"
                    value={config.tabelaTitulo}
                    onChange={(e) => handleInputChange('tabelaTitulo', e.target.value)}
                    placeholder="Ex: Cursos, Produtos, Serviços"
                  />
                </div>

                <div className="add-item-form">
                  <input
                    type="text"
                    value={novoItem}
                    onChange={(e) => setNovoItem(e.target.value)}
                    placeholder="Adicionar novo item"
                    onKeyPress={(e) => e.key === 'Enter' && adicionarItem()}
                  />
                  <button onClick={adicionarItem} className="add-button">+ Adicionar</button>
                </div>

                <div className="items-list">
                  {config.tabelaItens.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item}</span>
                      <button 
                        onClick={() => removerItem(index)}
                        className="remove-button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="editor-section">
            <h3>🎯 Tipos de Eventos</h3>
            <p className="section-description">
              Gerencie os tipos de eventos que aparecerão no modal de criação de eventos.
            </p>
            
            <div className="event-types-controls">
              <button 
                onClick={() => setShowEventTypesManager(true)}
                className="manage-types-button"
              >
                🎯 Gerenciar Tipos de Eventos
              </button>
              
              <div className="types-info">
                <small>
                  Configure tipos personalizados como:
                  <br/>
                   "Reunião", "Workshop", "Treinamento", etc.
                  <br />
                  Cada tipo pode ter sua própria cor e ícone.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="preview-section">
          <h3>👁️ Prévia:</h3>
          <div className="preview-container">
            <CustomizableHeader isPublic={false} config={config} />
          </div>
        </div>

          <div className="tips-section">
            <h4>💡 Dicas Úteis:</h4>
            <ul>
              <li>• Use cores contrastantes para melhor legibilidade</li>
              <li>• Mantenha textos concisos e informativos</li>
              <li>• URLs de logos devem ser públicas e estáveis</li>
              <li>• Teste em diferentes dispositivos</li>
            </ul>
          </div>

        <div className="editor-actions-right">
          <div className="action-buttons">
            <button onClick={onClose} className="cancel-button">
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="save-button"
            >
              {saving ? '⏳ Salvando...' : '💾 Salvar'}
            </button>
          </div>
        </div>

        {showEventTypesManager && (
          <EventTypesManager 
            onClose={() => setShowEventTypesManager(false)}
            onSave={(eventTypes) => {
              console.log('Tipos de eventos salvos:', eventTypes);
              setShowEventTypesManager(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HeaderEditor;