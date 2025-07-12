import React, { useState, useEffect } from "react";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db, obterTiposEventos } from "../../hooks/FireBase/firebaseconfig";
import { updateEvento} from "../../hooks/Calendario/updateEvento";
import { useAuth } from '../../hooks/Auth/useAuth';

const EventModalEdit = ({ event, onClose, onUpdateEvento }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(event.title);
  const [type, setType] = useState(event.type);
  const [desc, setDesc] = useState(event.desc);
  const [start, setStart] = useState(typeof event.start === "string"? event.start: new Date(event.start.seconds ? event.start.seconds * 1000 : event.start).toISOString().slice(0, 16));
  const [end, setEnd] = useState(typeof event.end === "string"? event.end: new Date(event.end.seconds ? event.end.seconds * 1000 : event.end).toISOString().slice(0, 16)
);
  const [important, setImportant] = useState(event.important);
  const [color, setColor] = useState(event.color || "#00aaff");
  const [tiposEventos, setTiposEventos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  useEffect(() => {
    const carregarTipos = async () => {
      if (user) {
        try {
          const tipos = await obterTiposEventos(user.uid);
          setTiposEventos(tipos);
        } catch (error) {
          console.error('Erro ao carregar tipos de eventos:', error);
        } finally {
          setLoadingTipos(false);
        }
      }
    };

    carregarTipos();
  }, [user]);

  const handleTipoChange = (tipoId) => {
    setType(tipoId);
    // Atualiza a cor automaticamente baseada no tipo selecionado
    const tipoSelecionado = tiposEventos.find(t => t.id === tipoId);
    if (tipoSelecionado) {
      setColor(tipoSelecionado.cor);
    }
  };



  return (
    <div className="modal_event">
      <div className="modal_event_container">
        <div className="modal_event_header">
          <h2>Editar Evento</h2>
          <button onClick={onClose} className="modal_event_close">X</button>
        </div>

        <div className="modal_event_body">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required/>

          <p>Tipo de Evento:</p>
          {loadingTipos ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>Carregando tipos...</span>
              <div className="spinner-small"></div>
            </div>
          ) : (
            <div className="tipo-evento-container">
              <select value={type} onChange={e => handleTipoChange(e.target.value)} required>
                <option value="">Selecione um tipo</option>
                {tiposEventos.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.icone} {tipo.nome}
                  </option>
                ))}
              </select>
              {type && (
                <div className="tipo-preview">
                  {(() => {
                    const tipoSelecionado = tiposEventos.find(t => t.id === type);
                    return tipoSelecionado ? (
                      <div 
                        className="tipo-badge"
                        style={{ backgroundColor: tipoSelecionado.cor }}
                      >
                        {tipoSelecionado.icone} {tipoSelecionado.nome}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          )}

          <textarea value={desc} onChange={e => setDesc(e.target.value)} required></textarea>

          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}required/>
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} required/>

          <select value={important} onChange={e => setImportant(e.target.value)}required>
            <option value="n/a">N/A</option>
            <option value="Leve">Leve</option>
            <option value="Moderado">Moderado</option>
            <option value="Importante">Importante</option>
            <option value="Urgente">Urgente</option>
          </select>

          <p>Escolha a cor do evento:</p>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} required/>

          <div className="modal_event_buttons">
            <button className="modal_event_save" onClick={handleUpdate}>Atualizar</button>
            <button className="modal_event_cancel" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventModalEdit;