import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'moment/locale/pt-br';
import EventModal from '../Modals/EventModal.jsx';
import EventModalAdd from '../Modals/EventModalAdd.jsx';
import { eventos, fetchEventos } from './../../hooks/Calendario/Eventos.js';
import { useAuth } from '../../hooks/Auth/useAuth.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { db } from '../../hooks/FireBase/firebaseconfig.js';
import './Style/calendario.css';

const DragAndDrop = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

function Calendario() {
  const { user } = useAuth();
  const [events, setEvents] = useState(eventos); //Iniciando com os eventos
  const [eventsSelected, setEventsSelected] = useState(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const onNavigate = useCallback((newDate) => setDate(newDate), [setDate])
  const onView = useCallback((newView) => setView(newView), [setView])

  React.useEffect(() => {
    const carregarEventos = async () => {
      if (user) {
        const dados = await fetchEventos(user.uid);
        const eventosConvertidos = dados.map(evento => ({
          ...evento,
          start: new Date(evento.start),
          end: new Date(evento.end),
        }));
        setEvents(eventosConvertidos);
      }
    };
    carregarEventos();
  }, [user]);
  
  const onEventDrop = async (data) => {
    const { start, end } = data;
    const updatedEvents = events.map((event) => {
      if (event.id === data.event.id) {
        return { 
          ...event, 
          start: new Date(start), // DT INICIO
          end: new Date(end), // DT FIM
        };
      }
      return event;
    });
    setEvents(updatedEvents);

    try {
      const eventToUpdate = updatedEvents.find(event => event.id === data.event.id);
      if (eventToUpdate) {
        const eventDocRef = doc(db, "eventos", eventToUpdate.id);
        await updateDoc(eventDocRef, {
          start: eventToUpdate.start,
          end: eventToUpdate.end,
        });
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao salvar evento no Firestore:", error);
    }
  };
  

  const onEventResize = async (data) => {
    const { start, end } = data;
    const updatedEvents = events.map((event) => {
      if (event.id === data.event.id) {
        return { ...event, start, end };
      }
      return event;
    });
    setEvents(updatedEvents);

    try {
      const eventToUpdate = updatedEvents.find(event => event.id === data.event.id);
      if (eventToUpdate) {
        const eventDocRef = doc(db, "eventos", eventToUpdate.id);
        await updateDoc(eventDocRef, {
          start: eventToUpdate.start,
          end: eventToUpdate.end,
        });
        window.location.reload(); // Atualiza a página
      }
    } catch (error) {
      console.error("Erro ao atualizar evento no Firestore:", error);
    }
  };

  const handleEventSelect = (event) => {
    setEventsSelected(event);
  };

  const handleEventClose = () => {
    setEventsSelected(null);
    window.location.reload();
  };

  const AdicionarEvent = (slotInfo) => {
    
    const newEvent = { // Objeto de evento inicial :D
      id: events.length + 1,
      title: '',
      start: slotInfo.start,
      end: slotInfo.end,
      color: '',
      type: '',
      important: '',
      desc: '',
    };
    setEvents([...events, newEvent]);
    setEventsSelected(newEvent);
    
  };

  const mensagem_traduzir = useMemo(() => ({ // mini mensagens traduzidas
    allDay: 'Dia inteiro',
    previous: 'Anterior',
    next: 'Proximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Horário',
    event: 'Evento',
    noEventsInRange: 'Nenhum evento encontrado ',
  }), []);

  const finaisSemana = useCallback((date) => {
    const cor_fim_de_semana = 'rgba(236, 17, 17, 0.09)';
    if (moment(date).day() === 0) {
      return { className: 'sunday', style: { backgroundColor: cor_fim_de_semana, color: 'black' } };
    }
    if (moment(date).day() === 6) {
      return { className: 'saturday', style: { backgroundColor: cor_fim_de_semana, color: 'black' } };
    }
    return {};
  }, []);

  const handleShareCalendar = async () => {
    if (user) {
      try {
        const userDoc = await import('../../hooks/FireBase/firebaseconfig.js').then(module => module.obterUsuario(user.uid));
        if (userDoc && userDoc.calendarioPublico) {
          const link = `${window.location.origin}/calendario/${userDoc.linkCalendario}`;
          navigator.clipboard.writeText(link).then(() => {
            alert('Link do calendário copiado para a área de transferência!');
          }).catch(() => {
            alert('Erro ao copiar link. Tente novamente.');
          });
        } else {
          alert('Calendário não está público. Configure nas configurações para torná-lo público.');
        }
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error);
        alert('Erro ao obter dados do usuário. Tente novamente.');
      }
    }
  };

  return (
    <div style={{ width: '100%', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3>Meu Calendário</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {events.length === 0 && (
            <span style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
              📋 Clique em uma data para criar seu primeiro evento
            </span>
          )}
          <button 
            onClick={handleShareCalendar}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📋 Compartilhar Calendário
          </button>
        </div>
      </div>
      <DragAndDrop
        localizer={localizer}
        defaultDate={moment().toDate()}
        defaultView="month"
        dayPropGetter={finaisSemana}
        messages={mensagem_traduzir}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        view={view}
        formats={FormatoAgenda.formats}
        views={['month', 'week', 'day', 'agenda']}
        style={{ height: '80vh', fontWeight: 'bold', fontSize: '1rem' }}
        events={events}
        resizable
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        eventPropGetter={EventStyle}
        onDoubleClickEvent={handleEventSelect}
        onSelectEvent={handleEventSelect}
        onUpdateEvent={handleEventSelect}
        selectable
        onSelectSlot={AdicionarEvent}
        className="calendario"
      />

      {eventsSelected && (
        <EventModal event={eventsSelected} onClose={handleEventClose} className="modal_event" />
      )}
      
      {eventsSelected && eventsSelected.title === '' && (
        <EventModalAdd event={eventsSelected} onClose={handleEventClose} className="modal_event" />
      )}
    </div>
  );
}

const EventStyle = (event) => {
  return {
    style: {
      backgroundColor: event.color,
      fontWeight: 'bold',
      fontSize: 20,
    },
  };
};

export default Calendario;

function FormatoAgenda() {
  const { defaultDate, formats, views } = useMemo({
    defaultDate: new Date(2025, 4, 27),
    formats: {
      agendaTimeRangeFormat: ({ start, end }, culture, localizer) =>
        localizer.format(start, 'HH:mm', culture) + ' - ' + localizer.format(end, 'HH:mm', culture),
    },
    views: [views.WEEK, views.DAY, views.AGENDA],
    
  });
}