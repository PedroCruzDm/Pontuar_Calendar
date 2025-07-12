import React, { useState, useEffect } from "react";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db, obterTiposEventos, obterCategoriaPreferida } from '../../hooks/FireBase/firebaseconfig.js';
import { useAuth } from '../../hooks/Auth/useAuth.js';
import './Styles/style.css';

// Templates de tipos de eventos (mesmo do EventTypesManager)
const pacotesTemplates = [
    {
      nome: 'Corporativo',
      templates: [
        {
          id: 'reuniao-template',
          nome: 'Reunião',
          cor: '#3498db',
          icone: '💼',
          descricao: 'Reuniões de trabalho',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 15, recorrente: false }
        },
        {
          id: 'apresentacao-template',
          nome: 'Apresentação',
          cor: '#e74c3c',
          icone: '📊',
          descricao: 'Apresentações e demos',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 90, lembreteAntes: 30, recorrente: false }
        },
        {
          id: 'treinamento-template',
          nome: 'Treinamento',
          cor: '#f39c12',
          icone: '🎓',
          descricao: 'Sessões de treinamento',
          categoria: 'corporativo',
          publico: true,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 60, recorrente: false }
        },
        {
          id: 'workshop-template',
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
      templates: [
        {
          id: 'aula-template',
          nome: 'Aula',
          cor: '#27ae60',
          icone: '📚',
          descricao: 'Aulas regulares',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 50, lembreteAntes: 10, recorrente: true }
        },
        {
          id: 'prova-template',
          nome: 'Prova',
          cor: '#e74c3c',
          icone: '📝',
          descricao: 'Avaliações e provas',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 1440, recorrente: false }
        },
        {
          id: 'seminario-template',
          nome: 'Seminário',
          cor: '#3498db',
          icone: '🎤',
          descricao: 'Seminários e palestras',
          categoria: 'educacional',
          publico: true,
          configuracoes: { duracaoPadrao: 90, lembreteAntes: 30, recorrente: false }
        },
        {
          id: 'laboratorio-template',
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
      templates: [
        {
          id: 'compromisso-template',
          nome: 'Compromisso',
          cor: '#e91e63',
          icone: '📅',
          descricao: 'Compromissos pessoais',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 30, recorrente: false }
        },
        {
          id: 'tempo-livre-template',
          nome: 'Tempo Livre',
          cor: '#4caf50',
          icone: '🎯',
          descricao: 'Tempo para atividades livres',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 120, lembreteAntes: 0, recorrente: false }
        },
        {
          id: 'exercicio-template',
          nome: 'Exercício',
          cor: '#ff9800',
          icone: '💪',
          descricao: 'Atividades físicas',
          categoria: 'pessoal',
          publico: false,
          configuracoes: { duracaoPadrao: 60, lembreteAntes: 15, recorrente: true }
        },
        {
          id: 'consulta-pessoal-template',
          nome: 'Consulta',
          cor: '#009688',
          icone: '🏥',
          descricao: 'Consultas médicas',
          categoria: 'saude',
          publico: false,
          configuracoes: { duracaoPadrao: 45, lembreteAntes: 60, recorrente: false }
        }
      ]
    }
  ];

// Função para obter todos os templates disponíveis
const obterTodosTemplates = () => {
    return pacotesTemplates.flatMap(pacote => pacote.templates);
};

const EventModalAdd = ({ event, onClose, onAddEvento }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(event.title);
    const [type, setType] = useState(event.type);
    const [desc, setDesc] = useState(event.desc);
    const [start, setStart] = useState(event.start.toISOString().slice(0, 16));
    const [end, setEnd] = useState(event.end.toISOString().slice(0, 16));
    const [important] = useState(event.important);
    const [color, setColor] = useState('#00aaff'); // Cor padrão inicial
    const [tiposEventos, setTiposEventos] = useState([]);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [categoriaAtiva, setCategoriaAtiva] = useState('todas');
    const [showQuickTypeCreator, setShowQuickTypeCreator] = useState(false);
    const [quickType, setQuickType] = useState({
        nome: '',
        cor: '#2196F3',
        icone: '📅'
    });

    useEffect(() => {
        const carregarTipos = async () => {
            if (user) {
                try {
                    // Carregar tipos salvos e categoria preferida
                    const [tiposSalvos, categoria] = await Promise.all([
                        obterTiposEventos(user.uid),
                        obterCategoriaPreferida(user.uid)
                    ]);
                    
                    setCategoriaAtiva(categoria);
                    
                    // Combinar tipos salvos com templates disponíveis
                    const todosTemplates = obterTodosTemplates();
                    const tiposCombinados = [...(tiposSalvos || []), ...todosTemplates];
                    
                    // Remover duplicatas baseado no nome
                    const tiposUnicos = tiposCombinados.filter((tipo, index, array) => 
                        array.findIndex(t => t.nome.toLowerCase() === tipo.nome.toLowerCase()) === index
                    );
                    
                    // Filtrar tipos baseado na categoria ativa
                    let tiposFiltrados = tiposUnicos;
                    if (categoria !== 'todas') {
                        tiposFiltrados = tiposUnicos.filter(tipo => tipo.categoria === categoria);
                    }
                    
                    setTiposEventos(tiposFiltrados);
                    
                    // Se há tipos filtrados e nenhum tipo foi selecionado, seleciona o primeiro
                    if (tiposFiltrados.length > 0 && !type) {
                        setType(tiposFiltrados[0].id);
                        setColor(tiposFiltrados[0].cor);
                    }
                } catch (error) {
                    console.error('Erro ao carregar tipos de eventos:', error);
                } finally {
                    setLoadingTipos(false);
                }
            }
        };

        carregarTipos();
    }, [user, type]);

    const handleTipoChange = (tipoId) => {
        setType(tipoId);
        // Atualiza a cor automaticamente baseada no tipo selecionado
        if (Array.isArray(tiposEventos)) {
            const tipoSelecionado = tiposEventos.find(t => t.id === tipoId);
            if (tipoSelecionado) {
                setColor(tipoSelecionado.cor);
            }
        }
    };

    const handleSave = async () => {
        if (!user) {
            alert("Você precisa estar logado para criar eventos.");
            return;
        }
        
        if (title.trim() === "") {
            alert("O título do evento não pode estar vazio.");
            return;
        } else if (start >= end) {
            alert("A data de início deve ser anterior à data de término.");
            return;
        }
        
        const localStart = new Date(new Date(start).getTime() - new Date().getTimezoneOffset() * 60000);
        const localEnd = new Date(new Date(end).getTime() - new Date().getTimezoneOffset() * 60000);

        const newEvent = {
            title,
            type,
            desc,
            start: localStart,
            end: localEnd,
            important,
            color,
            userId: user.uid, // Associa o evento ao usuário logado
            dataCriacao: new Date(),
            id: Date.now(),
        };
        
        try {
            const docRef = await addDoc(collection(db, "eventos"), newEvent);
            newEvent.id = docRef.id; // substitui o id local pelo id do Firestore
            
            if (onAddEvento) {
                onAddEvento(newEvent);
            }

            onClose();
            // Recarrega a página para atualizar a lista de eventos
            window.location.reload();
        } catch (error) {
            console.error("Erro ao adicionar evento:", error);
            alert("Erro ao adicionar evento. Tente novamente.");
        }
    };

    const handleQuickCreateType = async () => {
        if (quickType.nome.trim() && user) {
            try {
                const novoId = quickType.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const novoTipo = {
                    id: novoId,
                    nome: quickType.nome.trim(),
                    cor: quickType.cor,
                    icone: quickType.icone,
                    descricao: '',
                    prioridade: 'normal',
                    categoria: 'geral',
                    dataCriacao: new Date().toISOString()
                };

                // Adiciona à lista atual
                const tiposAtualizados = [...tiposEventos, novoTipo];
                setTiposEventos(tiposAtualizados);
                
                // Salva no Firebase
                const { salvarTiposEventos } = await import('../../hooks/FireBase/firebaseconfig');
                await salvarTiposEventos(user.uid, tiposAtualizados);
                
                // Seleciona o novo tipo e aplica sua cor
                setType(novoId);
                setColor(quickType.cor);
                
                // Reset do formulário
                setQuickType({ nome: '', cor: '#2196F3', icone: '📅' });
                setShowQuickTypeCreator(false);
            } catch (error) {
                console.error('Erro ao criar tipo rápido:', error);
                alert('Erro ao criar novo tipo. Tente novamente.');
            }
        }
    };

    return (
        <div className="modal_event" onClick={(e) => e.stopPropagation()}>
            <div className="modal_event_container">
                <div className="modal_event_header">
                    <h2>Adicionar novo Evento</h2>
                    <button onClick={onClose} className="modal_event_close">X</button>
                </div>

                <div className="modal_event_body">
                    <p>Nome do Evento:</p>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />

                    <p>Tipo de Evento:</p>
                    {loadingTipos ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Carregando tipos...</span>
                            <div className="spinner-small"></div>
                        </div>
                    ) : (
                        <div className="tipo-evento-container">
                            {categoriaAtiva !== 'todas' && (
                                <div className="categoria-ativa-info">
                                    <span>📂 Categoria: <strong>{
                                        categoriaAtiva === 'corporativo' ? '🏢 Corporativo' :
                                        categoriaAtiva === 'educacional' ? '🎓 Educacional' :
                                        categoriaAtiva === 'pessoal' ? '👤 Pessoal' :
                                        categoriaAtiva === 'saude' ? '🏥 Saúde' :
                                        categoriaAtiva === 'lazer' ? '🎉 Lazer' : categoriaAtiva
                                    }</strong></span>
                                    <span className="tipos-count">({tiposEventos.length} tipos disponíveis)</span>
                                </div>
                            )}
                            <div className="tipo-selection-header">
                                <select value={type} onChange={e => handleTipoChange(e.target.value)} required>
                                    <option value="">Selecione um tipo</option>
                                    {Array.isArray(tiposEventos) && tiposEventos.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.icone} {tipo.nome}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    type="button"
                                    onClick={() => setShowQuickTypeCreator(!showQuickTypeCreator)}
                                    className="quick-create-toggle"
                                    title="Criar novo tipo rapidamente"
                                >
                                    {showQuickTypeCreator ? '❌' : '➕'}
                                </button>
                            </div>

                            {showQuickTypeCreator && (
                                <div className="quick-type-creator">
                                    <h4>🚀 Criar Tipo Rapidamente</h4>
                                    <div className="quick-form">
                                        <input
                                            type="text"
                                            placeholder="Nome do novo tipo"
                                            value={quickType.nome}
                                            onChange={(e) => setQuickType({...quickType, nome: e.target.value})}
                                            className="quick-input"
                                        />
                                        <div className="quick-options">
                                            <input
                                                type="color"
                                                value={quickType.cor}
                                                onChange={(e) => setQuickType({...quickType, cor: e.target.value})}
                                                className="quick-color"
                                            />
                                            <input
                                                type="text"
                                                placeholder="🎯"
                                                value={quickType.icone}
                                                onChange={(e) => setQuickType({...quickType, icone: e.target.value})}
                                                className="quick-icon"
                                                maxLength="4"
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleQuickCreateType}
                                                className="quick-create-button"
                                                disabled={!quickType.nome.trim()}
                                            >
                                                Criar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type && (
                                <div className="tipo-preview">
                                    {(() => {
                                        if (Array.isArray(tiposEventos)) {
                                            const tipoSelecionado = tiposEventos.find(t => t.id === type);
                                            return tipoSelecionado ? (
                                                <div 
                                                    className="tipo-badge"
                                                    style={{ backgroundColor: tipoSelecionado.cor }}
                                                >
                                                    {tipoSelecionado.icone} {tipoSelecionado.nome}
                                                    {tipoSelecionado.descricao && (
                                                        <small className="tipo-desc">{tipoSelecionado.descricao}</small>
                                                    )}
                                                </div>
                                            ) : null;
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    <p>Descrição do Evento:</p>
                    <textarea 
                        value={desc} 
                        onChange={e => setDesc(e.target.value)} 
                        style={{resize: 'vertical', height: '20px', maxHeight: '100px'}} 
                        required 
                    ></textarea>

                    <p>Data de Início do evento:</p>
                    <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />

                    <p>Data de Final do evento:</p>
                    <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required />

                    <p>Escolha a cor do evento:</p>
                    <div style={{alignItems: 'center', display: 'flex', flexDirection: 'column'}}>
                        <div className="div_grupo_cor">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} required />
                        </div>
                    </div>

                    <div className="modal_event_buttons">
                        <button className="modal_event_save" onClick={handleSave}>Salvar</button>
                        <button className="modal_event_cancel" onClick={onClose}>Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventModalAdd;