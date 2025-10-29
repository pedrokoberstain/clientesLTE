// gefron-cliente/src/services/dbClientService.js

import { db } from "../firebaseConfig";
import { ref, onValue, off, set, serverTimestamp } from "firebase/database"; 


// ----------------------------------------------------
// 1. OBTENÇÃO DA LOCALIZAÇÃO (GPS)
// ----------------------------------------------------

/**
 * Obtém as coordenadas GPS (Latitude, Longitude e Precisão) do dispositivo.
 * @returns {Promise<Object>} Promessa que resolve com os dados de localização.
 */
const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocalização não é suportada pelo seu navegador/dispositivo."));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Sucesso: retorna as coordenadas e a precisão
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precisao: position.coords.accuracy,
        });
      },
      (error) => {
        // Erro: geralmente permissão negada, GPS desligado ou timeout
        let msg = `Erro ao obter localização (${error.code}): ${error.message}`;
        if (error.code === 1) {
             msg = "Permissão de localização negada pelo usuário.";
        }
        reject(new Error(msg));
      },
      // Opções para a coleta do GPS
      { 
        enableHighAccuracy: true, // Tenta usar GPS (mais preciso)
        timeout: 10000,           // Espera no máximo 10 segundos
        maximumAge: 0             // Não aceita cache de localização antiga
      }
    );
  });
};


// ----------------------------------------------------
// 2. ENVIO DA RESPOSTA (ESCRITA NO FIREBASE)
// ----------------------------------------------------

/**
 * Envia a resposta de localização (ou erro) para o nó /localizacoes.
 * @param {string} chipId - O ID do chip do celular alvo.
 * @param {Object|null} locationData - Dados de lat/lng/precisao.
 * @param {boolean} success - Indica se a coleta foi bem-sucedida.
 * @param {string|null} errorMessage - Mensagem de erro, se houver.
 */
export const sendLocationResponse = async (chipId, locationData, success, errorMessage = null) => {
    // Define o caminho onde a resposta será escrita: /localizacoes/{chipId}
    const responseRef = ref(db, `localizacoes/${chipId}`);

    const payload = {
        timestamp: serverTimestamp(),
        success: success,
        // Adiciona dados de localização (se houver) ou deixa o objeto vazio
        ...(locationData || {}), 
        errorMessage: errorMessage
    };

    await set(responseRef, payload);
    console.log(`Resposta enviada para /localizacoes/${chipId}. Status: ${success ? 'SUCESSO' : 'FALHA'}`);
}


// ----------------------------------------------------
// 3. EXECUÇÃO DO PING (RECEPÇÃO E RESPOSTA)
// ----------------------------------------------------

/**
 * Executa a obtenção do GPS e envia a resposta de localização ao Firebase.
 * Esta é a função que é chamada quando o PING é recebido.
 * @param {string} chipId - O ID do chip do celular.
 */
export const executeResponse = async (chipId) => {
    try {
        // 1. Tenta obter a localização
        const locationData = await getCurrentLocation();
        
        // 2. Se for bem-sucedido, envia a localização
        await sendLocationResponse(chipId, locationData, true); 

        return { success: true, message: `Localização obtida e enviada. Lat: ${locationData.lat.toFixed(4)}` };
        
    } catch (error) {
        // 3. Se falhar, envia um status de erro
        await sendLocationResponse(chipId, null, false, error.message); 

        return { success: false, message: `Falha ao obter GPS: ${error.message}` };
    }
}


// ----------------------------------------------------
// 4. INÍCIO DA ESCUTA (O UVINTE EM TEMPO REAL)
// ----------------------------------------------------

/**
 * Inicia a escuta no Firebase por comandos de PING para o Chip ID.
 * @param {string} chipId - O ID do chip que este cliente está monitorando.
 * @param {Function} onLog - Função para logar mensagens na interface do usuário.
 * @returns {Function} Função para parar de escutar (cleanup).
 */
export const startListeningForPings = (chipId, onLog) => {
  if (!chipId) return null;

  // Caminho que o cliente escuta: /comandos/{chipId}
  const commandRef = ref(db, `comandos/${chipId}`);

  // onValue é o listener em tempo real do Firebase
  const listener = onValue(commandRef, async (snapshot) => {
    const data = snapshot.val();
    
    // Verifica se os dados são válidos e se é o comando de PING
    if (data && data.solicitacao === "ping" && data.status === "enviado") {
      onLog(`Comando PING recebido de ${chipId}. Acionando GPS...`);
      
      // Executa a resposta (pegar GPS e enviar para /localizacoes)
      const result = await executeResponse(chipId); 
      
      // Loga o resultado na interface
      onLog(result.message);
    }
  });

  // Retorna a função de limpeza, importante para o React
  return () => {
    off(commandRef, 'value', listener);
    onLog("Escuta de comandos parada.");
  };
};