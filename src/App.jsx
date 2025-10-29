// clientesLTE/src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Importa o serviço de GPS (que você acabou de criar em src/services/dbClientService.js)
import { logCurrentLocation } from "./services/dbClientService.js"; 
// Importa os estilos (que você acabou de criar em src/App.css)
import './App.css';
// Importa a logo (verifique se ela está em src/assets/gefron-logo.jpg)
import logoGefron from './assets/gefron-logo.jpg'; 

function App() {
  const [chipId, setChipId] = useState('Adicione o nome do funcional'); 
  const [logs, setLogs] = useState([]);
  const [isTracking, setIsTracking] = useState(false); 
  const intervalRef = useRef(null);

  // --- Lógica de Log e Tracking (a cada 1 segundo) ---
  const logMessage = useCallback((message) => {
    setLogs((prevLogs) => [
      `${new Date().toLocaleTimeString()} | ${message}`,
      ...prevLogs,
    ]);
  }, []);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isTracking && chipId) {
      logMessage(`Iniciando tracking para ${chipId}. Enviando a cada 1 segundo.`);
      
      const runTracking = async () => {
        try {
          const result = await logCurrentLocation(chipId);
          logMessage(result.message);
        } catch (error) {
          logMessage(`Erro no loop de tracking: ${error.message}`);
        }
      };

      runTracking();
      // Define o intervalo para 1000ms (1 segundo)
      intervalRef.current = setInterval(runTracking, 1000); 
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        logMessage("Tracking parado.");
      }
    };
  }, [isTracking, chipId, logMessage]); 

  const toggleTracking = () => {
    if (!chipId) {
      alert("Por favor, insira o ID do Chip/Viatura.");
      return;
    }
    setIsTracking((prev) => !prev);
  };
  // --- Fim da Lógica ---

  return (
    // --- Layout com Classes CSS ---
    <div className="pwa-container">
      
      {/* Logo Grande */}
      <img src={logoGefron} alt="Logo GEFRON" className="pwa-logo" />

  <h1 className="header-title">GEFRON LTE</h1>
      <p className="header-subtitle">Modo de Teste de Cobertura</p>
      
      {/* Card de Configuração */}
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
          placeholder="Ex: GEFRON-001"
          disabled={isTracking} 
          className="chip-input"
        />
        
        <button 
          onClick={toggleTracking}
          disabled={!chipId}
          // Muda a classe (e a cor) com base no estado
          className={`toggle-button ${isTracking ? 'offline' : 'online'}`}
        >
          {isTracking ? 'PARAR TESTE' : 'INICIAR TESTE'}
        </button>
      </div>

      {/* Log de Atividades */}
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