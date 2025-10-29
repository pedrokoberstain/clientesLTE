// gefron-cliente/src/services/dbClientService.js

import { db } from "../firebaseConfig";
// Importações necessárias para o tracking contínuo
import { ref, push, serverTimestamp } from "firebase/database"; 

// ----------------------------------------------------
// 1. OBTENÇÃO DA LOCALIZAÇÃO (GPS)
// (Esta é a sua função original, que está ótima)
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
// 2. NOVA FUNÇÃO DE TRACKING (LOGAR LOCALIZAÇÃO)
// (Esta substitui todas as outras funções antigas)
// ----------------------------------------------------

/**
 * Tenta obter o GPS e salvar um registro (sucesso ou falha)
 * no histórico do Firebase.
 * @param {string} chipId - O ID do chip do celular.
 */
export const logCurrentLocation = async (chipId) => {
  
  console.log("--- Iniciando logCurrentLocation ---"); // DEBUG
  
  // Caminho para O HISTÓRICO daquele chip (ex: /historico_localizacoes/GEFRONTESTE-05)
  const historyRef = ref(db, `historico_localizacoes/${chipId}`);

  try {
    // 1. Tenta pegar o GPS
    console.log("Tentando pegar GPS..."); // DEBUG
    const locationData = await getCurrentLocation();
    console.log("GPS obtido:", locationData); // DEBUG
    
    // 2. Prepara o payload de SUCESSO
    const payload = {
      lat: locationData.lat,
      lng: locationData.lng,
      precisao: locationData.precisao,
      timestamp: serverTimestamp(), // Hora do Firebase
      success: true // ONLINE (Verde)
    };

    // 3. Tenta salvar no Firebase (push cria um novo ID na lista)
    console.log("Tentando salvar no Firebase (push)..."); // DEBUG
    await push(historyRef, payload);
    console.log("Salvo no Firebase com sucesso."); // DEBUG

    // Retorna a mensagem de sucesso para o log da tela
    return { success: true, message: `Online. Lat: ${locationData.lat.toFixed(4)}` };

  } catch (error) {
    // 4. Se falhou (GPS ou Rede)
    console.error("ERRO no bloco 'try' principal:", error); // DEBUG

    // Tenta gravar um PONTO VERMELHO (falha de GPS, mas com rede)
    try {
      const payload = {
        timestamp: serverTimestamp(),
        success: false, // OFFLINE (Vermelho)
        errorMessage: error.message, // Salva a mensagem de erro (ex: "Permissão negada")
      };
      
      console.log("Tentando salvar FALHA no Firebase..."); // DEBUG
      await push(historyRef, payload);
      
      // Retorna a mensagem de falha para o log da tela
      return { success: false, message: `Offline/Falha: ${error.message}` };

    } catch (dbError) {
      // Falha total (provavelmente sem rede LTE)
      console.error("ERRO ao tentar salvar a falha (dbError):", dbError); // DEBUG
      
      // Retorna a falha total para o log da tela
      return { success: false, message: `Falha total (Sem Rede): ${dbError.message}` };
    }
  }
};