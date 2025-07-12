import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/Auth/useAuth';
import AuthPage from './components/Auth/AuthPage';
import Navbar from './components/Navbar/Navbar';
import PublicCalendar from './components/PublicCalendar/PublicCalendar';
import Calendario from './components/Calendario/calendario.jsx';
import Settings from './components/Settings/Settings.jsx';
import Demo from './components/Demo/Demo.jsx';
import CustomizableHeader from './components/CustomizableHeader/CustomizableHeader.jsx';
import HeaderEditor from './components/HeaderEditor/HeaderEditor.jsx';
import Notification from './components/Notification/Notification.jsx';

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthPage />;
  }
  
  return children;
};

// Componente principal da aplicação autenticada
const MainApp = () => {
  const [showHeaderEditor, setShowHeaderEditor] = useState(false);
  const [hasHeaderConfig, setHasHeaderConfig] = useState(false);
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState(null);

  const handleHeaderSave = (newConfig) => {
    // Força a atualização do header em tempo real
    setHeaderRefreshTrigger(prev => prev + 1);
    setHasHeaderConfig(true);
    setShowHeaderEditor(false);
    
    // Mostra notificação de sucesso
    setNotification({
      message: 'Header personalizado atualizado com sucesso! 🎉',
      type: 'success'
    });
    
    console.log('Header atualizado com sucesso:', newConfig);
  };

  return (
    <div className='App Calendario'>
      <Navbar />
      <div className='App-header'>
        <div style={{ position: 'relative' }}>
          <CustomizableHeader 
            onConfigLoaded={setHasHeaderConfig} 
            refreshTrigger={headerRefreshTrigger}
          />
          {!hasHeaderConfig && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '30px 20px',
              textAlign: 'center',
              color: 'white',
              position: 'relative',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              margin: '10px 0'
            }}>
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎨</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: 'bold' }}>
                  Personalize seu Calendário
                </h3>
                <p style={{ margin: '0', fontSize: '14px', opacity: '0.9', maxWidth: '400px' }}>
                  Configure o cabeçalho com as informações da sua empresa ou instituição. 
                  Adicione seu logo, cores e informações personalizadas.
                </p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setShowHeaderEditor(true)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: hasHeaderConfig ? '#007bff' : '#fff',
              color: hasHeaderConfig ? 'white' : '#333',
              border: hasHeaderConfig ? 'none' : '1px solid #ddd',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            ✏️ Personalizar
          </button>
        </div>
      </div>
      
      <div className='divisoria_'>
        <Calendario />
      </div>
      
      {showHeaderEditor && (
        <HeaderEditor 
          onClose={() => setShowHeaderEditor(false)}
          onSave={handleHeaderSave}
        />
      )}
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota para calendários públicos - SEM AUTENTICAÇÃO */}
          <Route path="/calendario/:linkCalendario" element={<PublicCalendar />} />
          
          {/* Rota para demo - COM AUTENTICAÇÃO */}
          <Route path="/demo" element={
            <ProtectedRoute>
              <Demo />
            </ProtectedRoute>
          } />
          
          {/* Rota para configurações - COM AUTENTICAÇÃO */}
          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Rota principal protegida - COM AUTENTICAÇÃO */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainApp />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;