// gefron-cliente/src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Importa a função de tracking que criamos
import { logCurrentLocation } from "./services/dbService"; 
import './App.css'; 

function App() {
  const [chipId, setChipId] = useState('GEFRON0102'); // Pode deixar um padrão
  const [logs, setLogs] = useState([]);
  const [isTracking, setIsTracking] = useState(false); // Mudei de 'isListening' para 'isTracking'
  
  // Referência para o intervalo
  const intervalRef = useRef(null);

  // Função de Log (igual a sua, está ótima)
  const logMessage = useCallback((message) => {
    setLogs((prevLogs) => [
      `${new Date().toLocaleTimeString()} | ${message}`,
      ...prevLogs,
    ]);
  }, []);

  // Efeito que gerencia o intervalo de tracking
  useEffect(() => {
    // Limpa qualquer intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Se o tracking estiver ativo...
    if (isTracking && chipId) {
      logMessage(`Iniciando tracking para ${chipId}. Enviando a cada 3 segundos.`);
      
      // Função anônima para rodar o processo
      const runTracking = async () => {
        try {
          const result = await logCurrentLocation(chipId);
          logMessage(result.message);
        } catch (error) {
          logMessage(`Erro no loop de tracking: ${error.message}`);
        }
      };

      // 1. Roda imediatamente na primeira vez
      runTracking();

      // 2. Cria o intervalo para rodar a cada X segundos
      // ATENÇÃO: 1 segundo é muito rápido. Sugiro 3s (3000ms) ou 5s (5000ms).
      intervalRef.current = setInterval(runTracking, 3000); 
    }

    // Função de limpeza (quando o componente desmonta ou 'isTracking' muda)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        logMessage("Tracking parado.");
      }
    };
  }, [isTracking, chipId, logMessage]); // Dependências


  const toggleTracking = () => {
    if (!chipId) {
      alert("Por favor, insira o ID do Chip/Viatura.");
      return;
    }
    // Inverte o estado
    setIsTracking((prev) => !prev);
  };

  return (
    // Sugiro usar a sua estrutura anterior, que era mais completa
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Cliente PWA GEFRON LTE</h1>
      <p style={{ textAlign: 'center' }}>Modo de Teste de Cobertura</p>
      
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Configuração do Dispositivo</h3>
        
        <label htmlFor="chipId">ID do Chip / Viatura:</label>
        <input
          id="chipId"
          type="text"
          value={chipId}
          onChange={(e) => setChipId(e.target.value)}
          placeholder="Ex: GEFRON-001"
          disabled={isTracking} // Desabilita enquanto está rodando
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        
        <button 
          onClick={toggleTracking}
          disabled={!chipId}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: isTracking ? '#dc3545' : '#28a745', // Vermelho ou Verde
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {isTracking ? 'PARAR TESTE' : 'INICIAR TESTE DE COBERTURA'}
        </button>
      </div>

      <h3>Log de Atividades:</h3>
      <div style={{ height: '300px', overflowY: 'scroll', border: '1px solid #333', padding: '10px', backgroundColor: '#222', color: '#00ff00', fontFamily: 'monospace' }}>
        {logs.length > 0 ? (
          logs.map((log, index) => <p key={index} style={{ margin: '2px 0', fontSize: '12px' }}>{log}</p>)
        ) : (
          <p style={{ color: '#aaa' }}>Aguardando início do teste...</p>
        )}
      </div>
    </div>
  );
}

export default App;