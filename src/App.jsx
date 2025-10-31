import React, { useState, useEffect, useCallback, useRef } from 'react';
import { logCurrentLocation } from "./services/dbClientService.js"; 
import './App.css';
import logoGefron from './assets/gefron-logo.jpg'; 

function App() {
  const [chipId, setChipId] = useState(''); 
  const [logs, setLogs] = useState([]);
  const [isTracking, setIsTracking] = useState(false); 
  const intervalRef = useRef(null);
  const wakeLockRef = useRef(null);

  //Lógica de Log e Tracking (a cada 1 segundo)
  const logMessage = useCallback((message) => {
    setLogs((prevLogs) => [
      `${new Date().toLocaleTimeString()} | ${message}`,
      ...prevLogs,
    ]);
  }, []);

  useEffect(() => {
    // Re-aquisição do wake lock se a página voltar a ficar visível
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isTracking) {
        if ('wakeLock' in navigator) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.info('Wake Lock reaquiriido após visibilitychange');
          } catch (err) {
            console.warn('Falha ao reaquiriir Wake Lock:', err);
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const setup = async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isTracking && chipId) {
        logMessage(`Iniciando tracking para ${chipId}. Enviando a cada 2 segundo.`);
        // Tenta adquirir Wake Lock (mantém a tela ligada).
        if ('wakeLock' in navigator) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            console.info('Wake Lock adquirido');
          } catch (err) {
            console.warn('Não foi possível adquirir Wake Lock:', err);
          }
        }
        const runTracking = async () => {
          try {
            const result = await logCurrentLocation(chipId);
            logMessage(result.message);
          } catch (error) {
            logMessage(`Erro no loop de tracking: ${error.message}`);
          }
        };

        runTracking();
        // Define o intervalo para 2000ms (2 segundos)
        intervalRef.current = setInterval(runTracking, 2000);
      }
    };

    // chama a função assíncrona sem await (não bloqueia o cleanup)
    setup();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        logMessage("Tracking parado.");
      }
      // Ao limpar o effect (parar tracking ou desmontar), libera o wake lock se existir
      (async () => {
        try {
          if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            console.info('Wake Lock liberado no cleanup');
          }
        } catch (err) {
          console.warn('Erro ao liberar Wake Lock no cleanup:', err);
        }
      })();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, chipId, logMessage]); 

  const toggleTracking = async () => {
    if (!chipId) {
      alert("Por favor, insira o ID do Chip/Viatura.");
      return;
    }

    // Se vamos iniciar o tracking, tentamos solicitar o Wake Lock aqui —
    // caso o navegador não permita, o tracking continuará, mas a tela poderá travar.
    if (!isTracking) {
      if ('wakeLock' in navigator) {
        try {
          // @ts-ignore
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.info('Wake Lock adquirido ao iniciar o tracking');
        } catch (err) {
          console.warn('Não foi possível adquirir Wake Lock ao iniciar:', err);
        }
      }
    } else {
      // Parando o tracking: liberar o wake lock se houver
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          console.info('Wake Lock liberado ao parar o tracking');
        }
      } catch (err) {
        console.warn('Erro ao liberar Wake Lock ao parar:', err);
      }
    }

    setIsTracking((prev) => !prev);
  };

  return (
    <div className="pwa-container">
      
      <img src={logoGefron} alt="Logo GEFRON" className="pwa-logo" />

  <h1 className="header-title">GEFRON LTE</h1>
      <p className="header-subtitle">Modo de Teste de Cobertura</p>
      
      <div className="config-card">
        <h3>Configuração do Dispositivo</h3>
        
        <label htmlFor="chipId" className="config-label">
          ID do Chip / Viatura:
        </label>
        <input
          id="chipId"
          type="text"
          value={chipId}
          onChange={(e) => setChipId(e.target.value)}
          placeholder="Insira o nome e seu código. Ex: Teltronika - 01 / Viatura - 05"
          disabled={isTracking} 
          className="chip-input"
          />
        
        <button 
          onClick={toggleTracking}
          disabled={!chipId}
          className={`toggle-button ${isTracking ? 'offline' : 'online'}`}
        >
          {isTracking ? 'PARAR TESTE' : 'INICIAR TESTE'}
        </button>
      </div>

      <h3 className="log-header">Log de Atividades:</h3>
      <div className="log-box" role="log" aria-live="polite">
        {logs.length > 0 ? (
          logs.map((log, index) => {
            const isError = /offline|erro|falha/i.test(log);
            const parts = log.split('|');
            const time = parts.shift()?.trim();
            const text = parts.join('|').trim();

            return (
              <div key={index} className={`log-entry ${isError ? 'error' : 'success'}`}>
                <span className="timestamp">{time}</span>
                <span className="log-text">{text}</span>
              </div>
            );
          })
        ) : (
          <div className="log-placeholder">Aguardando início do teste...</div>
        )}
      </div>
    </div>
  );
}

export default App;