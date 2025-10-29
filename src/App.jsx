// gefron-cliente/src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { startListeningForPings } from "./services/dbService";
import './App.css'; 

function App() {
  // Estado para armazenar o ID do chip que este celular representa
  const [chipId, setChipId] = useState(''); 
  // Estado para gerenciar o log de atividades (mensagens)
  const [logs, setLogs] = useState([]);
  // Estado para verificar se a escuta está ativa
  const [isListening, setIsListening] = useState(false);

  // Função para adicionar mensagens ao log
  const logMessage = useCallback((message) => {
    setLogs((prevLogs) => [
      `${new Date().toLocaleTimeString()} | ${message}`,
      ...prevLogs, // Adiciona a nova mensagem no topo
    ]);
  }, []);

  // Efeito que inicia/para a escuta do Firebase quando o chipId muda
  useEffect(() => {
    let stopListening;

    if (isListening && chipId) {
      logMessage(`Iniciando escuta para o Chip ID: ${chipId}`);
      // Inicia a escuta, passando a função de log
      stopListening = startListeningForPings(chipId, logMessage);
    } else if (stopListening) {
      // Se pararmos de escutar, limpa o listener
      stopListening();
    }

    // Função de limpeza do useEffect (rodará quando o componente desmontar ou as dependências mudarem)
    return () => {
      if (stopListening) {
        stopListening();
      }
    };
  }, [chipId, isListening, logMessage]);


  const toggleListening = () => {
    if (!chipId) {
      alert("Por favor, insira o Chip ID para iniciar a escuta.");
      return;
    }

    // Inverte o estado da escuta (liga/desliga)
    setIsListening((prev) => !prev);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Cliente PWA GEFRON LTE</h1>
      <p style={{ textAlign: 'center' }}>Modo de Escuta em Tempo Real</p>
      
      <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Configuração do Dispositivo</h3>
        
        <label htmlFor="chipId">ID do Chip / Dispositivo:</label>
        <input
          id="chipId"
          type="text"
          value={chipId}
          onChange={(e) => setChipId(e.target.value)}
          placeholder="Ex: GEFRON-001"
          disabled={isListening}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        
        <button 
          onClick={toggleListening}
          disabled={!chipId}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: isListening ? '#dc3545' : '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          {isListening ? 'PARAR ESCUTA' : 'INICIAR ESCUTA DO FIREBASE'}
        </button>
      </div>

      <h3>Log de Atividades:</h3>
      <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #333', padding: '10px', backgroundColor: '#222', color: '#00ff00', fontFamily: 'monospace' }}>
        {logs.length > 0 ? (
          logs.map((log, index) => <p key={index} style={{ margin: '2px 0', fontSize: '12px' }}>{log}</p>)
        ) : (
          <p style={{ color: '#aaa' }}>Aguardando o ID do chip e o início da escuta...</p>
        )}
      </div>

    </div>
  );
}

export default App;