import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/Auth/useAuth';
import { salvarTiposEventos, obterTiposEventos, salvarCategoriaPreferida, obterCategoriaPreferida } from '../../hooks/FireBase/firebaseconfig';
import './EventTypesManager.css';

const EventTypesManager = ({ onClose, onSave }) => {
  const { user } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [novoTipo, setNovoTipo] = useState({
    nome: '',
    cor: '#3498db',
    icone: '📅',
    descricao: '',
    categoria: 'geral',
    publico: true,
    configuracoes: {
      duracaoPadrao: 60,
      lembreteAntes: 15,
      recorrente: false
    }
  });
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  // Pacotes de templates pré-definidos
  const pacotesTemplates = [
    {
      nome: 'Corporativo',
      descricao: 'Tipos para ambiente empresarial',
      cor: '#3498db',
      templates: [
        {
          nome: 'Reunião',
          cor: '#3498db',
          icone: '💼',
          descricao: 'Reuniões de trabalho',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 15, recorrente: false }
        },
        {
          nome: 'Apresentação',
          cor: '#e74c3c',
          icone: '📊',
          descricao: 'Apresentações e demos',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 90, lembreteAntes: 30, recorrente: false }
        },
        {
          nome: 'Treinamento',
          cor: '#f39c12',
          icone: '🎓',
          descricao: 'Sessões de treinamento',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 60, recorrente: false }
        },
        {
          nome: 'Workshop',
          cor: '#9b59b6',
          icone: '🔧',
          descricao: 'Workshops práticos',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 180, lembreteAntes: 30, recorrente: false }
        }
      ]
    },
    {
      nome: 'Educacional',
      descricao: 'Tipos para instituições de ensino',
      cor: '#27ae60',
      templates: [
        {
          nome: 'Aula',
          cor: '#27ae60',
          icone: '📚',
          descricao: 'Aulas regulares',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 50, lembreteAntes: 10, recorrente: true }
        },
        {
          nome: 'Prova',
          cor: '#e74c3c',
          icone: '📝',
          descricao: 'Avaliações e provas',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 1440, recorrente: false }
        },
        {
          nome: 'Seminário',
          cor: '#3498db',
          icone: '🎤',
          descricao: 'Seminários e palestras',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 90, lembreteAntes: 30, recorrente: false }
        },
        {
          nome: 'Laboratório',
          cor: '#f39c12',
          icone: '🔬',
          descricao: 'Aulas práticas de laboratório',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 15, recorrente: true }
        }
      ]
    },
    {
      nome: 'Pessoal',
      descricao: 'Tipos para uso pessoal',
      cor: '#e91e63',
      templates: [
        {
          nome: 'Compromisso',
          cor: '#e91e63',
          icone: '📅',
          descricao: 'Compromissos pessoais',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 30, recorrente: false }
        },
        {
          nome: 'Tempo Livre',
          cor: '#4caf50',
          icone: '🎯',
          descricao: 'Tempo para atividades livres',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 0, recorrente: false }
        },
        {
          nome: 'Exercício',
          cor: '#ff9800',
          icone: '💪',
          descricao: 'Atividades físicas',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 15, recorrente: true }
        },
        {
          nome: 'Consulta',
          cor: '#009688',
          icone: '🏥',
          descricao: 'Consultas médicas',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 45, lembreteAntes: 60, recorrente: false }
        }
      ]
    }
  ];

  // Ícones disponíveis
  const iconesDisponiveis = [
    '📅', '💼', '📊', '🎓', '🔧', '📚', '📝', '🎤', '🔬', '🎯',
    '💪', '🏥', '🍽️', '🎨', '🎵', '⚽', '🎮', '📞', '✈️', '🚗',
    '🏠', '💡', '📖', '💻', '📱', '🎬', '📺', '🛍️', '💰', '🎂',
    '❤️', '🌟', '⚡', '🔥', '💎', '🌈', '🎪', '🎭', '🎨', '🎯',
    '📌', '📍', '🔔', '⏰', '🗓️', '📋', '📊', '📈', '📉', '🎊'
  ];

  const carregarTipos = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Carregar tipos e categoria preferida
      const [tiposCarregados, categoriaPreferida] = await Promise.all([
        obterTiposEventos(user.uid),
        obterCategoriaPreferida(user.uid)
      ]);
      
      setTipos(tiposCarregados || []);
      setCategoriaFiltro(categoriaPreferida);
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      showMessage('Erro ao carregar tipos de eventos', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregarTipos();
  }, [carregarTipos]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddTipo = () => {
    if (!novoTipo.nome.trim()) {
      showMessage('Nome do tipo é obrigatório', 'error');
      return;
    }

    const novoId = novoTipo.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    if (tipos.some(tipo => tipo.id === novoId)) {
      showMessage('Já existe um tipo com esse nome', 'error');
      return;
    }

    const tipo = {
      ...novoTipo,
      id: novoId,
      dataCriacao: new Date().toISOString()
    };

    setTipos([...tipos, tipo]);
    setNovoTipo({
      nome: '',
      cor: '#3498db',
      icone: '📅',
      descricao: '',
      categoria: 'geral',
      publico: true,
      configuracoes: {
        duracaoPadrao: 60,
        lembreteAntes: 15,
        recorrente: false
      }
    });
    showMessage('Tipo adicionado com sucesso!', 'success');
  };

  const handleEditTipo = (tipo) => {
    setEditandoTipo(tipo);
    setNovoTipo(tipo);
  };

  const handleUpdateTipo = () => {
    if (!novoTipo.nome.trim()) {
      showMessage('Nome do tipo é obrigatório', 'error');
      return;
    }

    const tiposAtualizados = tipos.map(tipo => 
      tipo.id === editandoTipo.id ? { ...novoTipo, dataModificacao: new Date().toISOString() } : tipo
    );

    setTipos(tiposAtualizados);
    setEditandoTipo(null);
    setNovoTipo({
      nome: '',
      cor: '#3498db',
      icone: '📅',
      descricao: '',
      categoria: 'geral',
      publico: true,
      configuracoes: {
        duracaoPadrao: 60,
        lembreteAntes: 15,
        recorrente: false
      }
    });
    showMessage('Tipo atualizado com sucesso!', 'success');
  };

  const handleDeleteTipo = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo?')) {
      setTipos(tipos.filter(tipo => tipo.id !== id));
      showMessage('Tipo excluído com sucesso!', 'success');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Salvar tipos e categoria preferida
      await Promise.all([
        salvarTiposEventos(user.uid, tipos),
        salvarCategoriaPreferida(user.uid, categoriaFiltro)
      ]);
      
      showMessage('Tipos salvos com sucesso!', 'success');
      onSave(tipos);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Erro ao salvar tipos:', error);
      showMessage('Erro ao salvar tipos', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-types-overlay">
      <div className="event-types-container">
        <div className="event-types-header">
          <h2>🎯 Gerenciar Tipos de Eventos</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="event-types-content">
          
          {/* Configuração de Categoria */}
          <div className="category-filter-section">
            <h3>🎯 Configurar Categoria de Eventos</h3>
            <p>
              Escolha uma categoria para filtrar os tipos de eventos que aparecerão na criação de eventos.
            </p>
            <div className="category-selector-row">
              <label>Categoria Ativa:</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="todas">📋 Todas as Categorias</option>
                <option value="corporativo">🏢 Corporativo</option>
                <option value="educacional">🎓 Educacional</option>
                <option value="pessoal">👤 Pessoal</option>
                <option value="saude">🏥 Saúde</option>
                <option value="lazer">🎉 Lazer</option>
              </select>
            </div>
          </div>

          {/* Templates Section */}
          <div className="templates-section">
            <h3>🚀 Templates Rápidos</h3>
            <p className="section-subtitle">Clique para adicionar tipos pré-configurados</p>
            <div className="template-packages-list">
              {pacotesTemplates.map((pacote, idx) => (
                <div key={idx} className="template-package">
                  <div className="template-package-header" style={{ borderLeft: `6px solid ${pacote.cor}` }}>
                    <h4>{pacote.nome}</h4>
                    <span className="package-desc">{pacote.descricao}</span>
                  </div>
                  <div className="templates-grid">
                    {pacote.templates.map((template, index) => (
                      <button
                        key={template.nome}
                        className="template-button"
                        style={{ borderColor: template.cor }}
                        onClick={() => {
                          const novoId = template.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                          const tipo = {
                            ...template,
                            id: novoId,
                            dataCriacao: new Date().toISOString()
                          };
                          setTipos([...tipos, tipo]);
                          showMessage(`Tipo "${template.nome}" adicionado!`, 'success');
                        }}
                      >
                        <span className="template-icon">{template.icone}</span>
                        <span className="template-name">{template.nome}</span>
                        <small className="template-desc">{template.descricao}</small>
                        <div className="template-badges">
                          <span className="template-duration">
                            {template.configuracoes.duracaoPadrao >= 1440 ? 
                              `${Math.floor(template.configuracoes.duracaoPadrao / 1440)}d` : 
                              `${template.configuracoes.duracaoPadrao}min`}
                          </span>
                          {template.publico && <span className="template-public">Público</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de Criação/Edição */}
          <div className="form-section">
            <h3>{editandoTipo ? '✏️ Editar Tipo' : '➕ Criar Novo Tipo'}</h3>
            
            <div className="form-grid">
              <div className="input-group">
                <label>Nome do Tipo:</label>
                <input
                  type="text"
                  value={novoTipo.nome}
                  onChange={(e) => setNovoTipo({...novoTipo, nome: e.target.value})}
                  placeholder="Ex: Reunião, Aula, Workshop"
                />
              </div>

              <div className="input-group">
                <label>Descrição:</label>
                <input
                  type="text"
                  value={novoTipo.descricao}
                  onChange={(e) => setNovoTipo({...novoTipo, descricao: e.target.value})}
                  placeholder="Descrição do tipo de evento"
                />
              </div>

              <div className="input-group">
                <label>Cor:</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={novoTipo.cor}
                    onChange={(e) => setNovoTipo({...novoTipo, cor: e.target.value})}
                  />
                  <span className="color-preview" style={{ backgroundColor: novoTipo.cor }}></span>
                </div>
              </div>

              <div className="input-group">
                <label>Ícone:</label>
                <div className="icon-selector">
                  <input
                    type="text"
                    value={novoTipo.icone}
                    onChange={(e) => setNovoTipo({...novoTipo, icone: e.target.value})}
                    placeholder="Digite um emoji"
                    className="icon-input"
                  />
                  <div className="icons-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
                    gap: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    {iconesDisponiveis.map((icone, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`icon-option ${novoTipo.icone === icone ? 'selected' : ''}`}
                        onClick={() => setNovoTipo({...novoTipo, icone})}
                        style={{
                          width: '40px',
                          height: '40px',
                          border: novoTipo.icone === icone ? '2px solid #007bff' : '1px solid #ccc',
                          borderRadius: '6px',
                          backgroundColor: novoTipo.icone === icone ? '#e3f2fd' : 'white',
                          fontSize: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {icone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Duração Padrão (minutos):</label>
                <input
                  type="number"
                  value={novoTipo.configuracoes.duracaoPadrao}
                  onChange={(e) => setNovoTipo({
                    ...novoTipo, 
                    configuracoes: {
                      ...novoTipo.configuracoes,
                      duracaoPadrao: parseInt(e.target.value) || 60
                    }
                  })}
                  min="15"
                  max="1440"
                />
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={novoTipo.publico}
                    onChange={(e) => setNovoTipo({...novoTipo, publico: e.target.checked})}
                  />
                  Visível em calendários públicos
                </label>
              </div>
            </div>

            <div className="form-actions">
              {editandoTipo && (
                <button
                  onClick={() => {
                    setEditandoTipo(null);
                    setNovoTipo({
                      nome: '',
                      cor: '#3498db',
                      icone: '📅',
                      descricao: '',
                      categoria: 'geral',
                      publico: true,
                      configuracoes: {
                        duracaoPadrao: 60,
                        lembreteAntes: 15,
                        recorrente: false
                      }
                    });
                  }}
                  className="cancel-edit-button"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                onClick={editandoTipo ? handleUpdateTipo : handleAddTipo}
                className="add-type-button"
              >
                {editandoTipo ? '💾 Atualizar' : '➕ Adicionar'}
              </button>
            </div>
          </div>
        </div>

        <div className="event-types-footer">
          <button onClick={onClose} className="cancel-button">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="save-button"
          >
            {loading ? '⏳ Salvando...' : '💾 Salvar Tipos'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventTypesManager;
