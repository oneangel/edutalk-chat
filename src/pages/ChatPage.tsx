import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Check,
  Clock,
  MessageSquare,
} from 'lucide-react';
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

export function ChatPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

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

  //Get messages from API
  useEffect(()=> {
    if(!currentChat) return;

    const fetchMessages = async () => {
      try {
        const messagesData = await getUserMessages();
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    socket.on(
      'chat.conversation.af72a86f-f097-4d46-8415-60df848a0520',
      (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    );

    socket.on("chat.message.state", (data) => {
      const { message_id, state } = data;

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message_id ? { ...msg, state } : msg
        )
      );
    });

    return () => {
      socket.off(`chat.conversation.af72a86f-f097-4d46-8415-60df848a0520`);
      socket.off("chat.message.state");
    };
  }, [currentChat]);

  const MessageStatus = ({ state }: { state: Message['state'] }) => {
    switch (state.toLocaleLowerCase()) {
      case 'pending':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'unread':
        return (
          <div className="flex">
            <Check className="w-4 h-4 text-gray-400" />
            <Check className="w-4 h-4 -ml-2 text-gray-400" />
          </div>
        );
      case 'seen':
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
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${
                currentChat?.id === chat.id ? 'bg-gray-50' : ''
              }`}
              onClick={() => setCurrentChat(chat)}
            >
              <Avatar>
                <AvatarImage src={chat.avatar} />
                <AvatarFallback>{chat.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex justify-between">
                  <span className="font-medium">{chat.name}</span>
                  <span className="text-sm text-gray-500">{chat.timestamp}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </ScrollArea>
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
            <Button variant="ghost" size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca' ? 'justify-end' : 'justify-start'} space-x-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      <span className="text-xs opacity-70">{message.sent_at.split("T")[1].split(":").slice(0, 2).join(":")}</span>
                      {message.sender_id === '658b8f0e-4da1-46e4-ab9e-0558c5374dca' && <MessageStatus state={message.state} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Input placeholder="Escribe un mensaje..." />
              <Button>Enviar</Button>
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