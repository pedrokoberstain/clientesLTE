import { db } from "../firebaseConfig";
import { ref, push, serverTimestamp } from "firebase/database"; 

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

export const logCurrentLocation = async (chipId) => {
  
  console.log("--- Iniciando logCurrentLocation ---"); 
  
  // Caminho para O HISTÓRICO daquele chip (ex: /historico_localizacoes/GEFRONTESTE-05)
  const historyRef = ref(db, `historico_localizacoes/${chipId}`);

  try {
    // 1. Tenta pegar o GPS
    console.log("Tentando pegar GPS..."); 
    const locationData = await getCurrentLocation();
    console.log("GPS obtido:", locationData); 
    
    // 2. Prepara o payload de SUCESSO
    const payload = {
      lat: locationData.lat,
      lng: locationData.lng,
      precisao: locationData.precisao,
      timestamp: serverTimestamp(),
      success: true 
    };

    // 3. Tenta salvar no Firebase (push cria um novo ID na lista)
    console.log("Tentando salvar no Firebase (push)..."); 
    await push(historyRef, payload);
    console.log("Salvo no Firebase com sucesso."); 

    // Retorna a mensagem de sucesso para o log da tela
    return { success: true, message: `Online. Lat: ${locationData.lat.toFixed(4)}` };

  } catch (error) {
    // 4. Se falhou (GPS ou Rede)
    console.error("ERRO no bloco 'try' principal:", error);

    // Tenta gravar um PONTO VERMELHO (falha de GPS, mas com rede)
    try {
      const payload = {
        timestamp: serverTimestamp(),
        success: false,
        errorMessage: error.message,
      };
      
      console.log("Tentando salvar FALHA no Firebase..."); 
      await push(historyRef, payload);
      
      // Retorna a mensagem de falha para o log da tela
      return { success: false, message: `Offline/Falha: ${error.message}` };

    } catch (dbError) {
      // Falha total (provavelmente sem rede LTE)
      console.error("ERRO ao tentar salvar a falha (dbError):", dbError);
      
      // Retorna a falha total para o log da tela
      return { success: false, message: `Falha total (Sem Rede): ${dbError.message}` };
    }
  }
};