import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/Auth/useAuth';
import { useHeaderConfig } from '../../hooks/Header/useHeaderConfig';
import './CustomizableHeader.css';

const CustomizableHeader = ({ 
  isPublic = false, 
  linkCalendario = null, 
  config: propConfig = null, 
  onConfigLoaded,
  refreshTrigger = 0 
}) => {
  const { user } = useAuth();
  const { config, loading, refreshConfig, hasConfig } = useHeaderConfig(user, isPublic, linkCalendario);
  const [displayConfig, setDisplayConfig] = useState(null);

  useEffect(() => {
    // Se config é passado como prop (para preview), use-o diretamente
    if (propConfig) {
      setDisplayConfig(propConfig);
      if (onConfigLoaded) onConfigLoaded(true);
      return;
    }

    // Caso contrário, use o config do hook
    setDisplayConfig(config);
    if (onConfigLoaded) onConfigLoaded(hasConfig);
  }, [propConfig, config, hasConfig, onConfigLoaded]);

  // Atualiza quando refreshTrigger muda
  useEffect(() => {
    if (refreshTrigger > 0 && !propConfig) {
      refreshConfig();
    }
  }, [refreshTrigger, propConfig, refreshConfig]);

  if (loading) {
    return (
      <div className="customizable-header-loading">
        <div className="spinner"></div>
        <p>Carregando informações...</p>
      </div>
    );
  }

  // Se não há configuração, não mostra nada (tanto para público quanto privado)
  if (!displayConfig) {
    return null;
  }

  // Se há configuração, mostra normalmente
  if (displayConfig) {
    return (
      <div 
        className="customizable-header"
        style={{ 
          backgroundColor: displayConfig.corFundo, 
          color: displayConfig.corTexto 
        }}
      >
        <div className="header-content">
          <div className="header-info">
            <h2 className="header-title">{displayConfig.titulo}</h2>
            <h3 className="header-subtitle">{displayConfig.subtitulo}</h3>
            <p className="header-details">
              <b>{displayConfig.informacoes}</b>
            </p>
          </div>
          
          {displayConfig.mostrarLogos && (
            <div className="header-logos">
              {displayConfig.logos.map((logo, index) => (
                <img 
                  key={index}
                  src={logo.url.startsWith('/') ? process.env.PUBLIC_URL + logo.url : logo.url}
                  alt={logo.alt || `Logo ${index + 1}`}
                  className="header-logo"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
        </div>
        
        {displayConfig.mostrarTabela && displayConfig.tabelaItens && displayConfig.tabelaItens.length > 0 && (
          <div className="header-table-section">
            <div className="table-title-container">
              <h2 className="table-title">{displayConfig.tabelaTitulo || 'Itens'}</h2>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <tbody>
                  {displayConfig.tabelaItens.reduce((rows, item, index) => {
                    const isMobile = window.innerWidth <= 768;
                    const itemsPerRow = isMobile ? 2 : 4;
                    if (index % itemsPerRow === 0) rows.push([]);
                    rows[rows.length - 1].push(item);
                    return rows;
                  }, []).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((item, colIndex) => (
                        <td key={colIndex}>{item}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CustomizableHeader;
