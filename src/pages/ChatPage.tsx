import { useEffect, useState } from "react";
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
import { Search, Plus, Check, Clock, MessageSquare } from "lucide-react";
import { getUserMessages } from "@/lib/messages";
import { Message, Conversation } from "@/lib/types";
import { getUserConversations } from "@/lib/conversations";
import { jwtDecode } from "jwt-decode";

const socket = io("https://edutalk-by8w.onrender.com");

// Función para escapar caracteres especiales en Regex
const escapeRegExp = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export function ChatPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageSearchTerm, setMessageSearchTerm] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

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

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        // Decodifica el token
        const decodedToken = jwtDecode(token) as { [key: string]: any };
        const userId = decodedToken.id;

        const conversationsData = await getUserConversations(userId, token);
        setConversations(conversationsData);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, []);

  // Obtener mensajes de la API
  useEffect(() => {
    if (!currentChat) return;

    const fetchMessages = async () => {
      try {
        const messagesData = await getUserMessages(currentChat.id);
        setMessages(messagesData);
        setFilteredMessages(messagesData); // Inicializar los mensajes filtrados
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

  // Función para buscar mensajes
  const searchMessages = () => {
    if (messageSearchTerm.trim() === "") {
      setFilteredMessages(messages); // Si no hay término de búsqueda, mostrar todos los mensajes
    } else {
      const filtered = messages.filter((message) =>
        message.content.toLowerCase().includes(messageSearchTerm.toLowerCase())
      );
      setFilteredMessages(filtered); // Filtrar mensajes que coincidan con el término de búsqueda
    }
  };

  // Función para enviar un mensaje
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const messageToSend = {
      conversation_id: "af72a86f-f097-4d46-8415-60df848a0520", // Reemplaza con el UUID correcto
      sender_id: "658b8f0e-4da1-46e4-ab9e-0558c5374dca", // Reemplaza con el UUID del usuario actual
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
      setNewMessage(""); // Limpiar el input
      socket.emit("chat.message", data); // Notificar a otros usuarios via WebSocket
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

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Buscar usuario..." />
                  {/* Add user list here */}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                currentChat?.id === conversation.id ? "bg-gray-50" : ""
              }`}
              onClick={() => setCurrentChat(conversation)}
            >
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Juan" />
                <AvatarFallback>
                  {conversation.participant_one_id[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {conversation.participant_one_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca'
                      ? conversation.participant_two_id
                      : conversation.participant_one_id}
                  </span>
                  <span className="text-sm text-gray-500">
                  {conversation.created_at.split("T")[0]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  Último mensaje...
                </p>
              </div>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {currentChat ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/*<Avatar>
                <AvatarImage src={currentChat.avatar} />
                <AvatarFallback>{currentChat.name[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentChat.name}</span> */}
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

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === "658b8f0e-4da1-46e4-ab9e-0558c5374dca"
                      ? "justify-end"
                      : "justify-start"
                  } space-x-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id ===
                      "658b8f0e-4da1-46e4-ab9e-0558c5374dca"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p>{highlightText(message.content, messageSearchTerm)}</p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span className="text-xs opacity-70">
                        {message.sent_at
                          .split("T")[1]
                          .split(":")
                          .slice(0, 2)
                          .join(":")}
                      </span>
                      {message.sender_id ===
                        "658b8f0e-4da1-46e4-ab9e-0558c5374dca" && (
                        <MessageStatus state={message.state} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4" />
            <p>Selecciona un chat para comenzar</p>
          </div>
        </div>
      )}
    </div>
  );
}
