import { useState, useEffect, useCallback } from 'react';
import { obterConfiguracaoHeader, obterConfiguracaoHeaderPublico } from '../FireBase/firebaseconfig';

export const useHeaderConfig = (user, isPublic = false, linkCalendario = null) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConfig = useCallback(async () => {
    if (!user && !isPublic) {
      setConfig(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let configuracao = null;
      
      if (isPublic && linkCalendario) {
        configuracao = await obterConfiguracaoHeaderPublico(linkCalendario);
      } else if (user) {
        configuracao = await obterConfiguracaoHeader(user.uid);
      }
      
      setConfig(configuracao);
    } catch (err) {
      console.error('Erro ao carregar configuração do header:', err);
      setError(err);
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, [user, isPublic, linkCalendario]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const refreshConfig = useCallback(() => {
    loadConfig();
  }, [loadConfig]);

  const updateConfig = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  return {
    config,
    loading,
    error,
    refreshConfig,
    updateConfig,
    hasConfig: !!config
  };
};
