import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/Auth/useAuth';
import AuthPage from './components/Auth/AuthPage';
import Navbar from './components/Navbar/Navbar';
import PublicCalendar from './components/PublicCalendar/PublicCalendar';
import Calendario from './components/Calendario/calendario.jsx';
import { ano, cursos, cod_inst, unidade, cidade } from './hooks/Etec/Info.js';

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
  return (
    <div className='App Calendario'>
      <Navbar />
      <div className='App-header'>
        <div className='divisoria_2'>
          <div className='Info-div'>
            <h2>Calendario Escolar - {ano}</h2>
            <h3>({ano} - Etec da Zona Leste - Sede)</h3>
            <p>
              <b>Cód. inst: {cod_inst}  Unidade: {unidade} Cidade: {cidade}</b>
            </p>
          </div>
          <div className='Logo-div'>
            <img src={process.env.PUBLIC_URL + '/images/etec_zona_leste_logo.png'} alt="Logo" className='Logo-etec' />
            <img src={process.env.PUBLIC_URL + '/images/gov-sp-vertical.png'} alt="Logo" className='Logo-etec' />
          </div>
        </div>
        
        <div className='div-cursos'>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h2 className='div-cursos-titulo'>Cursos</h2>
          </div>
          <div className='div-cursos-tabela'>
            <table>
              <tbody>
                {cursos.reduce((rows, curso, index) => {
                  const isMobile = window.innerWidth <= 768;
                  const itemsPerRow = isMobile ? 3 : 4;
                  if (index % itemsPerRow === 0) rows.push([]);
                  rows[rows.length - 1].push(curso);
                  return rows;
                }, []).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((curso, colIndex) => (
                      <td key={colIndex}>{curso}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className='divisoria_'>
        <Calendario />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota para calendários públicos */}
          <Route path="/calendario/:linkCalendario" element={<PublicCalendar />} />
          
          {/* Rota principal protegida */}
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
