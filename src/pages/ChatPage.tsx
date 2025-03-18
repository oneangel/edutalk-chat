import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Check, Clock, MessageSquare } from 'lucide-react';
import { getUserMessages } from '@/lib/messages';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  state: 'pending' | 'unread' | 'seen';
  status: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const socket = io('https://edutalk-by8w.onrender.com');

// Función para escapar caracteres especiales en Regex
const escapeRegExp = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function ChatPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  const chats: Chat[] = [
    {
      id: '1',
      name: 'Juan Pérez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
      lastMessage: '¿Tienes los apuntes de matemáticas?',
      timestamp: '10:30',
      unread: 2,
    },
  ];

  // Función para resaltar coincidencias
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const escapedSearch = escapeRegExp(search);
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
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
    if (!currentChat) return;

    const fetchMessages = async () => {
      try {
        const messagesData = await getUserMessages();
        setMessages(messagesData);
        setFilteredMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    socket.on('chat.conversation.af72a86f-f097-4d46-8415-60df848a0520', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setFilteredMessages((prev) => [...prev, newMessage]);
    });

    socket.on('chat.message.state', (data) => {
      const { message_id, state } = data;
      setMessages((prev) => prev.map(msg => msg.id === message_id ? {...msg, state} : msg));
      setFilteredMessages((prev) => prev.map(msg => msg.id === message_id ? {...msg, state} : msg));
    });

    return () => {
      socket.off('chat.conversation.af72a86f-f097-4d46-8415-60df848a0520');
      socket.off('chat.message.state');
    };
  }, [currentChat]);

  const searchMessages = () => {
    const filtered = messageSearchTerm 
      ? messages.filter(msg => 
          msg.content.toLowerCase().includes(messageSearchTerm.toLowerCase())
        )
      : messages;
    setFilteredMessages(filtered);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch('https://edutalk-by8w.onrender.com/api/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: 'af72a86f-f097-4d46-8415-60df848a0520',
          sender_id: '658b8f0e-4da1-46e4-ab9e-0558c5374dca',
          content: newMessage,
        }),
      });

      if (!response.ok) throw new Error('Error sending message');
      
      const data = await response.json();
      setNewMessage('');
      socket.emit('chat.message', data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const MessageStatus = ({ state }: { state: Message['state'] }) => {
    switch (state.toLowerCase()) {
      case 'pending': return <Check className="w-4 h-4 text-gray-400" />;
      case 'unread': return (
        <div className="flex">
          <Check className="w-4 h-4 text-gray-400" />
          <Check className="w-4 h-4 -ml-2 text-gray-400" />
        </div>
      );
      case 'seen': return (
        <div className="flex">
          <Check className="w-4 h-4 text-blue-500" />
          <Check className="w-4 h-4 -ml-2 text-blue-500" />
        </div>
      );
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-lg flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* ... (código del sidebar sin cambios) */}
      </div>

      {/* Chat Area */}
      {currentChat ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={currentChat.avatar} />
                <AvatarFallback>{currentChat.name[0]}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{currentChat.name}</span>
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
                    message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca' 
                      ? 'justify-end' 
                      : 'justify-start'
                  } space-x-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{highlightText(message.content, messageSearchTerm)}</p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span className="text-xs opacity-70">
                        {message.sent_at.split('T')[1].split(':').slice(0, 2).join(':')}
                      </span>
                      {message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca' && (
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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