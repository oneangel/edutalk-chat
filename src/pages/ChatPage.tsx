import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Check, Clock, MessageSquare, Loader2 } from "lucide-react";
import { getUserMessages } from "@/lib/messages";
import { Message, Conversation } from "@/lib/types";
import { getUserConversations } from "@/lib/conversations";
import { jwtDecode } from "jwt-decode";

const socket = io("https://edutalk-by8w.onrender.com");

// Función para escapar caracteres especiales en Regex
const escapeRegExp = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Definición de la interfaz para usuarios
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Definición para mapeo de usuarios
interface UserMapping {
  [key: string]: User;
}

export function ChatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [usersData, setUsersData] = useState<UserMapping>({});
  const [lastMessages, setLastMessages] = useState<{[key: string]: Message}>({});
  
  // Estados para el modal de nueva conversación
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Agregar refs para manejar el scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Función para hacer scroll al final de los mensajes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Función para resaltar coincidencias
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;

    const escapedSearch = escapeRegExp(search);
    const regex = new RegExp(`(${escapedSearch})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Efecto para cargar las conversaciones
  useEffect(() => {
    const fetchConversations = async () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        console.error("No token found");
        return;
      }

      try {
        // Decodifica el token
        const decodedToken = jwtDecode(storedToken) as { [key: string]: any };
        setUserId(decodedToken.id);
        setToken(storedToken);
        const user_id = decodedToken.id;
        const conversationsData = await getUserConversations(user_id, storedToken);
        setConversations(conversationsData);
        setFilteredConversations(conversationsData); // Initialize filtered conversations
        
        // Cargar usuarios con los que tenemos conversaciones
        await fetchUsersWithConversations(user_id, storedToken);
        
        // Obtener el último mensaje para cada conversación
        await fetchLastMessagesForConversations(conversationsData, storedToken);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, []);
  
  // Función para obtener el último mensaje de cada conversación
  const fetchLastMessagesForConversations = async (conversations: Conversation[], token: string) => {
    const lastMessagesMap: {[key: string]: Message} = {};
    
    try {
      const fetchPromises = conversations.map(async (conversation) => {
        try {
          const messagesData = await getUserMessages(conversation.id);
          if (messagesData.length > 0) {
            // Ordenar mensajes por fecha y tomar el último
            const sortedMessages = messagesData.sort((a, b) => 
              new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            lastMessagesMap[conversation.id] = sortedMessages[0];
          }
        } catch (error) {
          console.error(`Error fetching messages for conversation ${conversation.id}:`, error);
        }
      });
      
      await Promise.all(fetchPromises);
      setLastMessages(lastMessagesMap);
    } catch (error) {
      console.error("Error fetching last messages:", error);
    }
  };
  
  // Función para obtener los datos de los usuarios con quienes se tiene conversación
  const fetchUsersWithConversations = async (userId: string, token: string) => {
    try {
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/user/with-conversation/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error fetching users with conversations");
      }

      const users = await response.json();
      
      // Crear un mapeo de ID a información completa del usuario
      const userMap: UserMapping = {};
      users.forEach((user: User) => {
        userMap[user.id] = user;
      });
      
      setUsersData(userMap);
    } catch (error) {
      console.error("Error fetching users with conversations:", error);
    }
  };

  // Función para cargar usuarios disponibles para nueva conversación
  const fetchAvailableUsers = async () => {
    if (!userId || !token) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await fetch(
        `https://edutalk-by8w.onrender.com/api/user/without-conversation/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error fetching users");
      }

      const users = await response.json();
      setAvailableUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error("Error fetching available users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Efecto para buscar usuarios cuando se abre el diálogo
  useEffect(() => {
    if (isDialogOpen) {
      fetchAvailableUsers();
    }
  }, [isDialogOpen, userId, token]);

  // Efecto para filtrar usuarios en la búsqueda
  useEffect(() => {
    if (userSearchTerm.trim() === "") {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, availableUsers]);

  // Obtener mensajes de la API cuando cambia la conversación actual
  useEffect(() => {
    if (!currentChat) return;

    const fetchMessages = async () => {
      try {
        const messagesData = await getUserMessages(currentChat.id);
        setMessages(messagesData);
        setFilteredMessages(messagesData); // Inicializar los mensajes filtrados
        
        // Hacemos scroll al final después de cargar los mensajes
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Escuchar nuevos mensajes
    socket.on(
      `chat.conversation.${currentChat.id}`,
      (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setFilteredMessages((prevMessages) => [...prevMessages, newMessage]); // Actualizar mensajes filtrados
        
        // Actualizar el último mensaje para esta conversación
        setLastMessages(prev => ({...prev, [currentChat.id]: newMessage}));
        
        // Hacer scroll hacia abajo cuando llega un nuevo mensaje
        setTimeout(scrollToBottom, 100);
      }
    );

    // Escuchar actualizaciones de estado de mensajes
    socket.on("chat.message.state", (data) => {
      const { message_id, state } = data;
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message_id ? { ...msg, state } : msg
        )
      );
      setFilteredMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message_id ? { ...msg, state } : msg
        )
      );
    });

    return () => {
      socket.off(`chat.conversation.${currentChat.id}`);
      socket.off("chat.message.state");
    };
  }, [currentChat]);

  // Efecto para hacer scroll al final cuando enviamos un mensaje
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  // Efecto para filtrar conversaciones cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      // No hay término de búsqueda, mostrar todas las conversaciones
      setFilteredConversations(conversations);
    } else {
      // Filtrar conversaciones según el nombre del usuario
      const filtered = conversations.filter((conversation) => {
        const otherParticipantId = conversation.participant_one_id === userId
          ? conversation.participant_two_id
          : conversation.participant_one_id;
        
        const user = usersData[otherParticipantId];
        if (user) {
          return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 user.email.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations, usersData, userId]);

  // Función para buscar mensajes
  const searchMessages = () => {
    if (messageSearchTerm.trim() === "") {
      setFilteredMessages(messages); // Si no hay término de búsqueda, mostrar todos los mensajes
      setTimeout(scrollToBottom, 100);
    } else {
      const filtered = messages.filter((message) =>
        message.content.toLowerCase().includes(messageSearchTerm.toLowerCase())
      );
      setFilteredMessages(filtered); // Filtrar mensajes que coincidan con el término de búsqueda
    }
  };

  // Función para crear una nueva conversación
  const createConversation = async () => {
    if (!selectedUser || !userId || !token) return;
    
    setIsCreatingConversation(true);
    try {
      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/conversation/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participant_one_id: userId,
            participant_two_id: selectedUser.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating conversation");
      }

      const newConversation = await response.json();
      
      // Actualizar la lista de conversaciones
      setConversations((prev) => [...prev, newConversation]);
      setFilteredConversations((prev) => [...prev, newConversation]);
      
      // Actualizar el mapeo de usuarios
      setUsersData((prev) => ({ ...prev, [selectedUser.id]: selectedUser }));
      
      // Cerrar el diálogo y seleccionar la nueva conversación
      setIsDialogOpen(false);
      setCurrentChat(newConversation);
      setSelectedUser(null);
      setUserSearchTerm("");
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Función para enviar un mensaje
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const messageToSend = {
      conversation_id: currentChat.id, 
      sender_id: userId, 
      content: newMessage,
    };

    try {
      const response = await fetch(
        "https://edutalk-by8w.onrender.com/api/message",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageToSend),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error sending message");
      }

      const data = await response.json();
      
      // Actualizar el último mensaje para esta conversación
      setLastMessages(prev => ({...prev, [currentChat.id]: data}));
      
      setNewMessage(""); // Limpiar el input
      socket.emit("chat.message", data); // Notificar a otros usuarios via WebSocket
      
      // Hacer scroll hacia abajo después de enviar un mensaje
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const MessageStatus = ({ state }: { state: Message["state"] }) => {
    switch (state.toLocaleLowerCase()) {
      case "pending":
        return <Check className="w-4 h-4 text-gray-400" />;
      case "unread":
        return (
          <div className="flex">
            <Check className="w-4 h-4 text-gray-400" />
            <Check className="w-4 h-4 -ml-2 text-gray-400" />
          </div>
        );
      case "seen":
        return (
          <div className="flex">
            <Check className="w-4 h-4 text-blue-500" />
            <Check className="w-4 h-4 -ml-2 text-blue-500" />
          </div>
        );
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  // Función para obtener el nombre de usuario y la primera letra
  const getUserInfo = (userId: string) => {
    const user = usersData[userId];
    if (user) {
      return {
        name: user.name,
        firstLetter: user.name.charAt(0).toUpperCase()
      };
    }
    // Fallback si no tenemos el usuario en la caché
    return {
      name: userId,
      firstLetter: userId.charAt(0).toUpperCase()
    };
  };

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg flex">
      {/* Sidebar */}
      <div className="flex flex-col border-r border-gray-200 w-80">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nuevo chat</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <Input 
                    placeholder="Buscar usuario..." 
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                  
                  {isLoadingUsers ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="h-60">
                      <div className="space-y-2">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors ${
                                selectedUser?.id === user.id ? "bg-gray-100 ring-2 ring-purple-500" : ""
                              }`}
                              onClick={() => setSelectedUser(user)}
                            >
                              <Avatar>
                                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="p-4 text-center text-gray-500">No se encontraron usuarios disponibles</p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        setSelectedUser(null);
                        setUserSearchTerm("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={createConversation} 
                      disabled={!selectedUser || isCreatingConversation}
                    >
                      {isCreatingConversation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        'Iniciar chat'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => {
              const otherParticipantId = conversation.participant_one_id === userId
                ? conversation.participant_two_id
                : conversation.participant_one_id;
              
              const { name, firstLetter } = getUserInfo(otherParticipantId);
              
              // Obtener el último mensaje de esta conversación
              const lastMessage = lastMessages[conversation.id];
                
              return (
                <button
                  key={conversation.id}
                  className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                    currentChat?.id === conversation.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => setCurrentChat(conversation)}
                >
                  <Avatar>
                    <AvatarFallback>
                      {firstLetter}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {highlightText(name, searchTerm)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage ? 
                        (lastMessage.sender_id === userId ? "Tú: " : "") + lastMessage.content 
                        : "No hay mensajes aún"}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              No se encontraron conversaciones
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {currentChat ? (
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {(() => {
                const otherParticipantId = currentChat.participant_one_id === userId
                  ? currentChat.participant_two_id
                  : currentChat.participant_one_id;
                
                const { name, firstLetter } = getUserInfo(otherParticipantId);
                
                return (
                  <>
                    <Avatar>
                      <AvatarFallback>
                        {firstLetter}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {name}
                    </span>
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Buscar en mensajes..."
                value={messageSearchTerm}
                onChange={(e) => setMessageSearchTerm(e.target.value)}
                className="w-48"
              />
              <Button onClick={searchMessages}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === userId
                      ? "justify-end"
                      : "justify-start"
                  } space-x-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === userId
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p>{highlightText(message.content, messageSearchTerm)}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                      <span className="text-xs opacity-70">
                        {message.sent_at
                          .split("T")[1]
                          .split(":")
                          .slice(0, 2)
                          .join(":")}
                      </span>
                      {message.sender_id === userId && (
                        <MessageStatus state={message.state} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Elemento invisible al final para hacer scroll */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage}>Enviar</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p>Selecciona un chat para comenzar</p>
          </div>
        </div>
      )}
    </div>
  );
}