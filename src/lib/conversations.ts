import { Conversation } from "./types";

export async function getUserConversations(
    userId: string,
    token: string
  ): Promise<Conversation[]> {
    try {
      // Verifica que el userId está definido
      if (!userId) {
        throw new Error("The user ID is required to fetch conversations.");
      }
  
      const response = await fetch(`https://edutalk-by8w.onrender.com/api/conversation/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pasamos el token como encabezado para la autenticación
        },
      });
  
      if (!response.ok) {
        throw new Error(
          `Failed to fetch conversations. Status: ${response.status} - ${response.statusText}`
        );
      }
  
      // Parseamos la respuesta como JSON
      const conversations: Conversation[] = await response.json();
      return conversations;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw error; // Lanza el error para que sea manejado por el que llame a la función
    }
  }