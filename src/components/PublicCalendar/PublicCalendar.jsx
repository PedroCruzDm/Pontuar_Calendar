import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { obterCalendarioPublico } from '../../hooks/FireBase/firebaseconfig';
import CustomizableHeader from '../CustomizableHeader/CustomizableHeader.jsx';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';
import './PublicCalendar.css';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

// Modal para mostrar detalhes do evento (somente leitura)
const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="modal_event" onClick={onClose}>
      <div className="modal_event_container" onClick={(e) => e.stopPropagation()}>
        <div className="modal_event_header">
          <h2>{event.title}</h2>
          <button onClick={onClose} className="modal_event_close">×</button>
        </div>
        
        <div className="modal_event_body">
          <div className="event-detail-row">
            <strong>Tipo:</strong> {event.type || 'Não especificado'}
          </div>
          
          <div className="event-detail-row">
            <strong>Descrição:</strong> 
            <p>{event.desc || 'Sem descrição'}</p>
          </div>
          
          <div className="event-detail-row">
            <strong>Início:</strong> 
            {new Date(event.start).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "long", 
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Sao_Paulo",
            })}
          </div>
          
          <div className="event-detail-row">
            <strong>Fim:</strong>
            {new Date(event.end).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric", 
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "America/Sao_Paulo",
            })}
          </div>
          
          <div className="event-detail-row">
            <strong>Importância:</strong> {event.important || 'N/A'}
          </div>
          
          <div className="readonly-notice">
            <span style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
              👁️ Este é um calendário público - você pode visualizar mas não editar os eventos.
            </span>
          </div>
        </div>
        
        <div className="modal_event_buttons">
          <button className="modal_event_cancel" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

const PublicCalendar = () => {
  const { linkCalendario } = useParams();
  const [calendario, setCalendario] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const carregarCalendario = async () => {
      try {
        const dados = await obterCalendarioPublico(linkCalendario);
        
        if (dados) {
          setCalendario(dados.calendario);
          setEventos(dados.eventos);
        } else {
          setError('Calendário não encontrado ou não é público');
        }
      } catch (error) {
        console.error('Erro ao carregar calendário:', error);
        setError('Erro ao carregar calendário');
      } finally {
        setLoading(false);
      }
    };

    if (linkCalendario) {
      carregarCalendario();
    }
  }, [linkCalendario]);

  // Função para navegar entre as datas
  const handleNavigate = (date) => {
    setCurrentDate(date);
  };

  // Função para mudar a visualização
  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  if (loading) {
    return (
      <div className="public-calendar-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando calendário...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-calendar-container">
        <div className="error-container">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => window.location.href = '/'}>
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-calendar-container">
      <CustomizableHeader isPublic={true} linkCalendario={linkCalendario} />
      
      <div className="calendar-header">
        <h1>📅 {calendario?.nome}</h1>
        <p className="institution">{calendario?.instituicao}</p>
        <div className="calendar-info">
          <span className="public-badge">
            🌐 Calendário Público
          </span>
          <span className="readonly-badge">
            👁️ Somente Leitura
          </span>
        </div>
      </div>
      
      <div className="calendar-wrapper">
        <Calendar
          localizer={localizer}
          events={eventos}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          style={{ height: 600 }}
          messages={{
            next: "Próximo",
            previous: "Anterior",
            today: "Hoje",
            month: "Mês",
            week: "Semana",
            day: "Dia",
            agenda: "Agenda",
            noEventsInRange: "Não há eventos neste período",
            showMore: (total) => `+${total} mais`,
            date: "Data",
            time: "Hora",
            event: "Evento",
            allDay: "Dia inteiro"
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color || '#3174ad',
              borderRadius: '5px',
              opacity: 0.8,
              color: 'white',
              border: '0px',
              display: 'block'
            }
          })}
          onSelectEvent={(event) => setSelectedEvent(event)}
          onDoubleClickEvent={(event) => setSelectedEvent(event)}
          popup={true}
          popupOffset={{x: 30, y: 20}}
          views={['month', 'week', 'day', 'agenda']}
          step={60}
          timeslots={1}
          min={new Date(2024, 0, 1, 6, 0, 0)}
          max={new Date(2024, 0, 1, 22, 0, 0)}
        />
      </div>
      
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
      
      <div className="calendar-footer">
        <div className="footer-content">
          <div className="footer-info">
            <h3>📅 {calendario?.nome}</h3>
            <p>Calendário público compartilhado</p>
          </div>
          <div className="footer-actions">
            <p>� Clique nos eventos para ver detalhes</p>
            <p>🔄 Use os controles acima para navegar entre meses, semanas e dias</p>
            <p>
              Quer criar seu próprio calendário?{' '}
              <a href="/" className="create-account-link">Clique aqui</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCalendar;
