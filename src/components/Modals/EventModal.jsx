import React, { useState, useEffect } from "react";
import { db, obterTiposEventos } from './../../hooks/FireBase/firebaseconfig.js';
import { doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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
          descricao: 'Apresentações',
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

// Função para obter informações do tipo de evento
const obterInfoTipo = (tipoId, tiposPersonalizados = []) => {
  // Procura primeiro nos tipos personalizados
  const tipoPersonalizado = tiposPersonalizados.find(tipo => tipo.id === tipoId || tipo.nome === tipoId);
  if (tipoPersonalizado) {
    return tipoPersonalizado;
  }

  // Procura nos templates
  const todosTemplates = obterTodosTemplates();
  const template = todosTemplates.find(t => t.id === tipoId || t.nome === tipoId);
  if (template) {
    return template;
  }

  // Tipos padrão antigos (fallback)
  const tiposPadrao = {
    'Reunião': { icone: '🤝', cor: '#2196F3' },
    'reuniao': { icone: '🤝', cor: '#2196F3' },
    'Evento': { icone: '🎉', cor: '#4CAF50' },
    'evento': { icone: '🎉', cor: '#4CAF50' },
    'Tarefa': { icone: '📝', cor: '#795548' },
    'tarefa': { icone: '📝', cor: '#795548' },
    'Sabado Letivo': { icone: '📚', cor: '#FF9800' },
    'Aula': { icone: '📚', cor: '#FF9800' },
    'aula': { icone: '📚', cor: '#FF9800' },
    'Prazo': { icone: '⏰', cor: '#FF5722' },
    'deadline': { icone: '⏰', cor: '#FF5722' },
    'Consulta': { icone: '🏥', cor: '#E91E63' },
    'consulta': { icone: '🏥', cor: '#E91E63' },
    'Outro': { icone: '📅', cor: '#9E9E9E' }
  };

  return tiposPadrao[tipoId] || { icone: '📅', cor: '#9E9E9E' };
};

// Função segura para converter qualquer tipo de data
const toISOStringSafe = (date) => {
  if (date?.toDate) return date.toDate().toISOString().slice(0, 16); // Firebase Timestamp
  if (typeof date === 'string') return new Date(date).toISOString().slice(0, 16); // String
  if (date instanceof Date) return date.toISOString().slice(0, 16); // Date
  return "";
};

const EventModal = ({ event, onClose, onDeleteEvento, onUpdateEvento }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [type, setType] = useState(event.type);
  const [desc, setDesc] = useState(event.desc);
  const [start, setStart] = useState(toISOStringSafe(event.start));
  const [end, setEnd] = useState(toISOStringSafe(event.end));
  const [important, setImportant] = useState(event.important);
  const [color, setColor] = useState(event.color || '#00aaff');
  const [tiposPersonalizados, setTiposPersonalizados] = useState([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState([]);

  // Carrega os tipos personalizados do usuário
  useEffect(() => {
    const carregarTipos = async () => {
      if (user) {
        try {
          const tipos = await obterTiposEventos(user.uid);
          const todosTemplates = obterTodosTemplates();
          const tiposCombinados = [...(tipos || []), ...todosTemplates];
          
          // Remover duplicatas baseado no nome
          const tiposUnicos = tiposCombinados.filter((tipo, index, array) => 
            array.findIndex(t => t.nome.toLowerCase() === tipo.nome.toLowerCase()) === index
          );
          
          setTiposPersonalizados(tipos || []);
          setTiposDisponiveis(tiposUnicos);
        } catch (error) {
          console.error('Erro ao carregar tipos:', error);
        }
      }
    };

    carregarTipos();
  }, [user]);

  // Obter informações do tipo atual
  const infoTipo = obterInfoTipo(event.type, tiposPersonalizados);

  // Verifica se o usuário atual é o dono do evento
  const isOwner = user && event.userId === user.uid;

  const handleDelete = async () => {
    if (!isOwner) {
      alert("Você não tem permissão para excluir este evento.");
      return;
    }

    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        const docRef = doc(db, "eventos", event.id);
        await deleteDoc(docRef);

        if (onDeleteEvento) onDeleteEvento(event.id);
        onClose();
        window.location.reload();
      } catch (error) {
        console.error("Erro ao excluir evento:", error);
        alert("Erro ao excluir evento. Tente novamente.");
      }
    }
  };

  const handleUpdate = async () => {
    if (!isOwner) {
      alert("Você não tem permissão para editar este evento.");
      return;
    }

    if (title.trim() === "") {
      alert("O título do evento não pode estar vazio.");
      return;
    }

    if (start >= end) {
      alert("A data de início deve ser anterior à data de término.");
      return;
    }

    const updatedEvent = {
      title,
      type,
      desc,
      start: new Date(start),
      end: new Date(end),
      important,
      color,
      dataModificacao: new Date(),
    };

    try {
      const docRef = doc(db, "eventos", event.id);
      await updateDoc(docRef, updatedEvent);

      if (onUpdateEvento) {
        onUpdateEvento({
          ...event,
          ...updatedEvent,
          start: new Date(start),
          end: new Date(end),
        });
      }

      setIsEditing(false);
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      alert("Erro ao atualizar evento. Tente novamente.");
    }
  };

  return (
    <div className="modal_event">
      <div className="modal_event_container">
        <div className="modal_event_header">
          <h2>{isEditing ? "Editar Evento" : event.title}</h2>

          {/* Exibe o badge do tipo de evento */}
          <span className="event_type_badge" style={{ backgroundColor: infoTipo.cor || event.color }}>
            <span className="event_type_icon_large">{infoTipo.icone}</span>
            <span className="event_type_name">{event.type}</span>
          </span>
          <button onClick={onClose} className="modal_event_close">×</button>
        </div>

        <div className="modal_event_body">
          {isEditing ? (
            <>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />

              <select value={type} onChange={e => setType(e.target.value)} required>
                <option value="">Selecione um tipo</option>
                {tiposDisponiveis.map(tipo => (
                  <option key={tipo.id || tipo.nome} value={tipo.id || tipo.nome}>
                    {tipo.icone} {tipo.nome}
                  </option>
                ))}
                {/* Tipos antigos para compatibilidade */}
                <option value="Reunião">🤝 Reunião</option>
                <option value="Tarefa">📝 Tarefa</option>
                <option value="Evento">🎉 Evento</option>
                <option value="Sabado Letivo">📚 Sábado Letivo</option>
                <option value="Outro">📅 Outro</option>
              </select>

              <textarea value={desc} onChange={e => setDesc(e.target.value)} required></textarea>

              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} required />
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required />

              <select value={important} onChange={e => setImportant(e.target.value)} required>
                <option value="n/a">N/A</option>
                <option value="Leve">Leve</option>
                <option value="Moderado">Moderado</option>
                <option value="Importante">Importante</option>
                <option value="Urgente">Urgente</option>
              </select>

              <p>Escolha a cor do evento:</p>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} required />
            </>
          ) : (
            <>              
              <p>Descrição: {event.desc}</p>
              
              <p>Início: {new Date(event.start).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })}</p>

              <p>Fim: {new Date(event.end).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })}</p>
              <br></br>
              {!isOwner && (
                <p style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                  💡 Este evento foi criado por outro usuário. Você pode visualizá-lo mas não pode editá-lo.
                </p>
              )}
            </>
          )}
        </div>

        <div className="modal_event_buttons">
          {isEditing ? (
            <>
              <button className="modal_event_save" onClick={handleUpdate}>Salvar Alterações</button>
              <button className="modal_event_cancel" onClick={() => setIsEditing(false)}>Cancelar</button>
            </>
          ) : (
            <>
              {isOwner && (
                <>
                  <button className="modal_event_edit" onClick={() => setIsEditing(true)}>Editar</button>
                  <button className="modal_event_delete" onClick={handleDelete}>Excluir</button>
                </>
              )}
              <button className="modal_event_cancel" onClick={onClose}>Fechar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;