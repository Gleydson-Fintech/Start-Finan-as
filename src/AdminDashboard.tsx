import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity,
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  ChevronRight, 
  ChevronDown,
  Send, 
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronLeft,
  Filter,
  Paperclip,
  Image as ImageIcon,
  Film,
  BarChart3,
  Brain,
  Megaphone,
  Bell,
  Coins,
  Sliders,
  Check,
  BookOpen,
  Plus,
  UserCheck,
  AlertTriangle,
  ArrowLeftRight,
  FileText,
  MoreVertical,
  Coffee,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from './lib/utils';

// Global variable simulating active profile/role
export let GLOBAL_ACTIVE_ROLE: 'admin' | 'supervisor' | 'atendente' = 'admin';

interface ChatRoom {
  room: string;
  userName: string;
  status: 'waiting' | 'active' | 'ended';
  lastMessage: string;
  updatedAt: string;
}

interface Message {
  room: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem: boolean;
  fileData?: string;
  fileType?: string;
}

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'active' | 'ended'>('all');
  const [isDark, setIsDark] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New BI, CRM, and Communication States
  const [activeTab, setActiveTab] = useState<'chats' | 'analytics' | 'communication' | 'config'>('chats');
  const [currentRole, setCurrentRole] = useState<'admin' | 'supervisor' | 'atendente'>(() => {
    try {
      const saved = localStorage.getItem('anny_admin_role');
      const role = (saved as any) || GLOBAL_ACTIVE_ROLE;
      // Sync global variable
      GLOBAL_ACTIVE_ROLE = role;
      return role;
    } catch {
      return GLOBAL_ACTIVE_ROLE;
    }
  });

  // Sync state changes with the global variable
  useEffect(() => {
    GLOBAL_ACTIVE_ROLE = currentRole;
    localStorage.setItem('anny_admin_role', currentRole);
  }, [currentRole]);

  // Chat Font size config
  const [chatFontSize, setChatFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anny_chat_font_size');
      return saved ? parseInt(saved, 10) : 13;
    } catch {
      return 13;
    }
  });

  useEffect(() => {
    localStorage.setItem('anny_chat_font_size', chatFontSize.toString());
  }, [chatFontSize]);

  // Messages editing & replying & menu states
  const [editingMessage, setEditingMessage] = useState<{ index: number; text: string } | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any | null>(null);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [activeMsgMenuIndex, setActiveMsgMenuIndex] = useState<number | null>(null);

  // Operator Creation states
  const [newOperatorName, setNewOperatorName] = useState('');
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [newOperatorRole, setNewOperatorRole] = useState<'admin' | 'supervisor' | 'atendente'>('atendente');
  const [operatorSuccessMsg, setOperatorSuccessMsg] = useState<string | null>(null);

  const [attendantStatus, setAttendantStatus] = useState<'available' | 'nr17' | 'bathroom' | 'lunch' | 'feedback' | 'meeting' | 'support'>('available');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [pauseElapsed, setPauseElapsed] = useState<number>(0);
  
  // Tabulação e encerramento
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [selectedClosureReason, setSelectedClosureReason] = useState('');
  const [closureCounts, setClosureCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('anny_closure_counts');
      return saved ? JSON.parse(saved) : {
        'Dúvida de Saldo': 12,
        'Contestação de Gasto': 8,
        'Problema no Aplicativo': 4,
        'Dúvida sobre Metas': 15,
        'Outros': 3
      };
    } catch {
      return {
        'Dúvida de Saldo': 12,
        'Contestação de Gasto': 8,
        'Problema no Aplicativo': 4,
        'Dúvida sobre Metas': 15,
        'Outros': 3
      };
    }
  });

  // Transferência de chamados
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransferAttendant, setSelectedTransferAttendant] = useState('');
  const [transferredRooms, setTransferredRooms] = useState<string[]>([]);

  // Escala Log types
  const INITIAL_SCALE_LOGS = [
    { id: 1, attendant: 'Lucas Silva', loginTime: '08:00', logoutTime: '17:00', pauseDuration: 4200 }, // 1h 10m
    { id: 2, attendant: 'Beatriz Costa', loginTime: '09:00', logoutTime: '18:00', pauseDuration: 3600 }, // 1h
    { id: 3, attendant: 'Rodrigo Lima', loginTime: '10:00', logoutTime: '19:00', pauseDuration: 2400 }, // 40m
    { id: 4, attendant: 'Clara Meireles', loginTime: '11:15', logoutTime: '---', pauseDuration: 1800 }, // 30m
  ];

  const [scaleLogs, setScaleLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('anny_scale_logs');
      return saved ? JSON.parse(saved) : INITIAL_SCALE_LOGS;
    } catch {
      return INITIAL_SCALE_LOGS;
    }
  });

  // Timer ticks and logs updates
  useEffect(() => {
    let timer: any;
    if (attendantStatus !== 'available') {
      if (!pauseStartTime) {
        setPauseStartTime(Date.now());
      }
      timer = setInterval(() => {
        if (pauseStartTime) {
          setPauseElapsed(Math.floor((Date.now() - pauseStartTime) / 1000));
        } else {
          setPauseElapsed(prev => prev + 1);
        }
      }, 1000);
    } else {
      setPauseStartTime(null);
      setPauseElapsed(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [attendantStatus, pauseStartTime]);

  useEffect(() => {
    localStorage.setItem('anny_scale_logs', JSON.stringify(scaleLogs));
  }, [scaleLogs]);

  useEffect(() => {
    localStorage.setItem('anny_closure_counts', JSON.stringify(closureCounts));
  }, [closureCounts]);

  // Update scale logs pause time in real time
  useEffect(() => {
    if (attendantStatus !== 'available') {
      setScaleLogs(prev => {
        const exists = prev.find(l => l.attendant === 'Você Atendente');
        if (exists) {
          return prev.map(l => l.attendant === 'Você Atendente' ? { ...l, pauseDuration: l.pauseDuration + 1 } : l);
        } else {
          return [
            ...prev,
            { id: Date.now(), attendant: 'Você Atendente', loginTime: '08:24', logoutTime: '---', pauseDuration: 1 }
          ];
        }
      });
    }
  }, [pauseElapsed, attendantStatus]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [showCRM, setShowCRM] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('anny_crm_notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Client notes auto-persistence
  useEffect(() => {
    localStorage.setItem('anny_crm_notes', JSON.stringify(clientNotes));
  }, [clientNotes]);

  // CRM Info Generator based strictly on User / Room ID (Deterministic Hash)
  const getClientCRMContext = (userName: string | undefined, roomName: string | null) => {
    const id = roomName || "anonymous";
    const name = userName || "Usuário";
    
    const isGleydson = name.toLowerCase().includes('gleydson');
    
    if (isGleydson) {
      return {
        fullName: name,
        email: "gleydson.rodrigues@warren.com.br",
        balance: (1000).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        expenses: (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        investorProfile: "N/A",
        financialStatus: "Ativo",
        userId: id
      };
    } else {
      return {
        fullName: name,
        email: "N/A",
        balance: (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        expenses: (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        investorProfile: "N/A",
        financialStatus: "N/A",
        userId: id
      };
    }
  };

  // State configurations for Custom Dropdown selector and TMA metrics calculation
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [roomSupportTimes, setRoomSupportTimes] = useState<Record<string, { start?: string; end?: string }>>(() => {
    try {
      const saved = localStorage.getItem('anny_room_support_times');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Keep support times synchronized with localStorage
  useEffect(() => {
    localStorage.setItem('anny_room_support_times', JSON.stringify(roomSupportTimes));
  }, [roomSupportTimes]);

  // Synchronize pre-calculated human care times for existing ended rooms if any
  useEffect(() => {
    let updated = false;
    const newSupportTimes = { ...roomSupportTimes };
    rooms.forEach(room => {
      if (room.status === 'ended' && !newSupportTimes[room.room]) {
        const idHash = room.room.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const durationMinutes = 3 + (idHash % 5) + (idHash % 60) / 60; // 3 to 8 minutes
        const end = new Date(room.updatedAt || Date.now()).toISOString();
        const start = new Date(new Date(end).getTime() - durationMinutes * 60 * 1000).toISOString();
        newSupportTimes[room.room] = { start, end };
        updated = true;
      }
    });
    if (updated) {
      setRoomSupportTimes(newSupportTimes);
    }
  }, [rooms]);

  // AI Knowledge Training State
  const [unresolvedQuestions, setUnresolvedQuestions] = useState([
    { id: 1, text: 'Quero integrar com minha carteira Binance e criptoativos', count: 14, date: 'Hoje, 10:24' },
    { id: 2, text: 'O que acontece se eu cadastrar um prejuízo retroativo no meu saldo?', count: 8, date: 'Ontem, 16:40' },
    { id: 3, text: 'Consigo baixar os relatórios em formato PDF no iPhone?', count: 5, date: 'Ontem, 11:15' },
    { id: 4, text: 'Dão bônus de indicação ou cashback nas metas de investimentos?', count: 3, date: 'Há 2 dias' },
  ]);
  const [trainingAnswers, setTrainingAnswers] = useState<Record<number, string>>({});
  const [savedSuccessLog, setSavedSuccessLog] = useState<string | null>(null);
  const [customKnowledgeBase, setCustomKnowledgeBase] = useState<{question: string, answer: string, date: string}[]>([
    { question: "Como mudar para o modo escuro/claro?", answer: "Você pode mudar o tema clicando no botão de sol/lua localizado nas configurações.", date: "23/05/2026" },
    { question: "Como exportar relatórios financeiros?", answer: "Acesse a seção de Transações e clique em 'Exportar' para baixar sua planilha atualizada.", date: "22/05/2026" },
  ]);
  const [curationQuestion, setCurationQuestion] = useState('');
  const [curationAnswer, setCurationAnswer] = useState('');

  // Mass Alerts notification states
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationAudience, setNotificationAudience] = useState<'all' | 'unpaid' | 'conservative'>('all');
  const [notificationShowSuccess, setNotificationShowSuccess] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([
    { title: '🔒 Atualização Importante de Segurança', body: 'Implementamos criptografia de ponta a ponta na sincronização dos seus dados bancários locais. Aproveite!', audience: 'Todos os Usuários', date: '23/05/2026 14:15' },
    { title: '🛡️ Novidades na Renda Fixa', body: 'Novas metas e simulações para títulos de CDB com liquidez diária disponíveis.', audience: 'Perfil Conservador', date: '21/05/2026 09:30' }
  ]);

  // Mural de Comunicados states (Central de Comunicação)
  const [comunicados, setComunicados] = useState<{
    id: number;
    title: string;
    content: string;
    category: 'Atualização' | 'Manutenção' | 'Aviso';
    date: string;
    author: string;
    feedbacks: {
      id: number;
      userName: string;
      rating: number;
      comment: string;
    }[];
  }[]>(() => {
    try {
      const saved = localStorage.getItem('anny_comunicados');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 1,
        title: "⚠️ Manutenção Preventiva dos Gateways de Liquidação",
        content: "Para otimização da performance bancária, realizaremos uma manutenção preventiva em nossos canais de processamento de PIX e depósitos pix/TED neste sábado, das 02:00 às 04:00 (FNR17). O tempo estimado de indisponibilidade é de no máximo 2 minutos por usuário.",
        category: "Manutenção",
        date: "24/05/2026 14:30",
        author: "Diretoria de Tech Ops",
        feedbacks: [
          { id: 1, userName: "Beatriz Costa (Supervisor)", rating: 5, comment: "Excelente, o aviso prévio nos ajuda a orientar preventivamente os correntistas." },
          { id: 2, userName: "Lucas Silva (Atendente)", rating: 4, comment: "Perfeito, manutenção programada em horas de baixíssima volumetria." }
        ]
      },
      {
        id: 2,
        title: "🚀 Sincronização e Triagem Inteligente da Anny V4.2.0",
        content: "Nossa assistente robótica recebeu uma calibração cognitiva para rebalanceamento de carteiras corporativas e esclarecimento de dúvidas sobre tributação regressiva. A taxa de retenção interna saltou para 78% nos canais homologados.",
        category: "Atualização",
        date: "23/05/2026 10:15",
        author: "Inovação & IA",
        feedbacks: [
          { id: 3, userName: "Rodrigo Lima (Atendente)", rating: 5, comment: "O tempo de resposta da Anny ficou sensacional nesta versão." }
        ]
      },
      {
        id: 3,
        title: "📌 Conformidade de Descanso sob Governança da NR17",
        content: "Relembramos a todo o time operacional a obrigatoriedade de registrar as pausas regulamentares de 10 minutos para prevenção de fadiga. O não cumprimento refletirá no consolidado do painel administrativo corporativo.",
        category: "Aviso",
        date: "22/05/2026 09:00",
        author: "Compliance & RG",
        feedbacks: []
      }
    ];
  });

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'Aviso' | 'Atualização' | 'Manutenção'>('Aviso');
  const [newNoticeSuccess, setNewNoticeSuccess] = useState(false);
  const [newFeedbacks, setNewFeedbacks] = useState<Record<number, { rating: number; comment: string }>>({});

  useEffect(() => {
    try {
      localStorage.setItem('anny_comunicados', JSON.stringify(comunicados));
    } catch (e) {
      console.error(e);
    }
  }, [comunicados]);

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    const newNotice: {
      id: number;
      title: string;
      content: string;
      category: 'Atualização' | 'Manutenção' | 'Aviso';
      date: string;
      author: string;
      feedbacks: { id: number; userName: string; rating: number; comment: string; }[];
    } = {
      id: Date.now(),
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      date: format(new Date(), 'dd/MM/yyyy HH:mm'),
      author: "Administração Anny",
      feedbacks: []
    };

    setComunicados(prev => [newNotice, ...prev]);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticeCategory('Aviso');
    setNewNoticeSuccess(true);
    setTimeout(() => setNewNoticeSuccess(false), 3000);
  };

  const handleAddFeedback = (comunicadoId: number) => {
    const feedbackData = newFeedbacks[comunicadoId];
    const rating = feedbackData?.rating || 0;
    const comment = feedbackData?.comment || '';

    if (rating === 0) {
      alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    let actualUser = "Você (Atendente)";
    if (currentRole === 'admin') actualUser = "Você (Admin)";
    else if (currentRole === 'supervisor') actualUser = "Você (Supervisor)";

    const newFeedbackItem = {
      id: Date.now(),
      userName: actualUser,
      rating,
      comment: comment.trim()
    };

    setComunicados(prev => prev.map(c => {
      if (c.id === comunicadoId) {
        return {
          ...c,
          feedbacks: [...c.feedbacks, newFeedbackItem]
        };
      }
      return c;
    }));

    setNewFeedbacks(prev => ({
      ...prev,
      [comunicadoId]: { rating: 0, comment: '' }
    }));
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      const data = await res.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchMessages = async (room: string) => {
    try {
      const res = await fetch(`/api/chat/${room}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Add interval polling fallback for rooms when socket is disconnected
    const pollingInterval = setInterval(() => {
      if (!newSocket || !newSocket.connected) {
        fetchRooms();
      }
    }, 4500);

    const newSocket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Admin socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.log('Admin socket disconnected, using fallback HTTP polling:', err.message);
    });

    newSocket.on('admin_room_update', () => {
      fetchRooms();
    });

    newSocket.on('admin_notification', (data: any) => {
      console.log('New attendant request:', data);
      fetchRooms();
    });

    return () => {
      newSocket.close();
      clearInterval(pollingInterval);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Message) => {
      if (selectedRoom === data.room) {
        setMessages(prev => {
          if (prev.some(m => m.timestamp === data.timestamp && m.text === data.text)) {
            return prev;
          }
          return [...prev, data];
        });
      }
      fetchRooms();
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [selectedRoom, socket]);

  useEffect(() => {
    if (!selectedRoom) {
      setShowSidebar(true);
      return;
    }
    
    fetchMessages(selectedRoom);
    
    if (socket) {
      socket.emit('join_room', selectedRoom);
    }
    
    // On mobile, hide sidebar when room is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }

    // Polling fallback for messages of selected room when socket is disconnected
    const msgFallbackInterval = setInterval(() => {
      if (!socket || !socket.connected) {
        fetchMessages(selectedRoom);
      }
    }, 3000);

    return () => {
      clearInterval(msgFallbackInterval);
    };
  }, [selectedRoom, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text: string, file?: { data: string, type: string }, replyTo?: string) => {
    if (!text.trim() && !file && !selectedRoom) return;

    const messageData = {
      room: selectedRoom!,
      sender: 'admin',
      text,
      timestamp: new Date().toISOString(),
      isSystem: false,
      fileData: file?.data,
      fileType: file?.type,
      replyTo: replyTo
    };

    if (socket && socket.connected) {
      socket.emit('send_message', messageData);
    } else {
      // HTTP Fallback Post message
      fetch(`/api/chat/${selectedRoom}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })
      .then(res => res.json())
      .then(sentMsg => {
        setMessages(prev => {
          if (prev.some(m => m.timestamp === sentMsg.timestamp && m.text === sentMsg.text)) {
            return prev;
          }
          return [...prev, sentMsg];
        });
        fetchRooms();
      })
      .catch(err => console.log('Error sending admin msg via fallback URL:', err.message));
    }
    
    setInput('');

    // If room was waiting, set it to active
    const room = rooms.find(r => r.room === selectedRoom);
    if (room && room.status === 'waiting') {
      setRoomSupportTimes(prev => ({
        ...prev,
        [selectedRoom!]: {
          ...prev[selectedRoom!],
          start: new Date().toISOString()
        }
      }));
      fetch('/api/admin/rooms/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: selectedRoom, status: 'active' })
      }).then(() => fetchRooms());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSendMessage('', { data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleEndService = () => {
    if (!selectedRoom || !socket) return;

    setRoomSupportTimes(prev => ({
      ...prev,
      [selectedRoom!]: {
        ...prev[selectedRoom!],
        end: new Date().toISOString()
      }
    }));

    socket.emit('service_ended', selectedRoom);
    
    const systemMsg = {
      room: selectedRoom,
      sender: 'Sistema',
      text: 'O atendimento foi finalizado pelo atendente.',
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    socket.emit('send_message', systemMsg);
    setSelectedRoom(null);
  };

  const filteredRooms = rooms.filter(r => {
    if (transferredRooms.includes(r.room)) return false;
    const matchesSearch = r.userName?.toLowerCase().includes(search.toLowerCase()) || 
                         r.room.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn(
      "flex h-screen pb-16 overflow-hidden font-sans transition-colors duration-300 w-full relative",
      isDark ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Global Overlay Modal for agent pauses */}
      <AnimatePresence>
        {attendantStatus !== 'available' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={cn(
                "w-full max-w-md p-8 rounded-3xl border text-center space-y-6 shadow-2xl relative overflow-hidden",
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200 text-zinc-900"
              )}
            >
              {/* Abstract decorative background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 blur-3xl rounded-full -z-10" />

              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center animate-pulse">
                  <Coffee size={28} />
                </div>
                <div>
                  <h2 className={cn("text-xl font-extrabold tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                    Em Pausa: {
                      attendantStatus === 'nr17' ? 'Pausa NR17' :
                      attendantStatus === 'bathroom' ? 'Banheiro' :
                      attendantStatus === 'lunch' ? 'Lanche/Almoço' :
                      attendantStatus === 'feedback' ? 'Feedback' :
                      attendantStatus === 'meeting' ? 'Reunião' : 'Suporte'
                    }
                  </h2>
                  <p className="text-xs text-zinc-550 max-w-xs mx-auto mt-2 leading-relaxed">
                    Tempo de pausa regido pelas diretrizes de governança e ergonomia. Seus novos atendimentos estão suspensos.
                  </p>
                </div>
              </div>

              <div className={cn(
                "py-4 px-6 rounded-2xl inline-block mx-auto font-mono text-3xl font-extrabold tracking-wider border",
                isDark ? "bg-zinc-950/50 border-zinc-800 text-rose-450" : "bg-rose-500/5 border-rose-100 text-rose-600"
              )}>
                {formatTimer(pauseElapsed)}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setAttendantStatus('available')}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl text-xs transition-all uppercase tracking-wider cursor-pointer shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] select-none"
                >
                  Encerrar Pausa e Ficar Disponível
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Backdrop Overlay (for Tablet and Mobile Left Sidebar) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Unified Responsive Left Sidebar Nav & Chats Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 border-r flex flex-col transition-transform duration-350 shrink-0",
        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
        "lg:relative lg:translate-x-0 lg:flex lg:z-0", // Desktop configuration overrides
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        // Mobile layout behaviors
        activeTab === 'chats' && !selectedRoom ? "max-md:translate-x-0 max-md:flex max-md:w-full max-md:border-r-0" : ""
      )}>
        {/* Sidebar Header Container */}
        <div className={cn("p-5 border-b shrink-0", isDark ? "border-zinc-800" : "border-zinc-150")}>
          <div className="flex items-center justify-between">
            <h1 className="text-base font-extrabold flex items-center gap-2 tracking-tight">
              <Activity size={18} className="text-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">Painel Admin Anny</span>
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => setIsDark(!isDark)}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isDark ? "hover:bg-zinc-850 text-zinc-400" : "hover:bg-zinc-100 text-zinc-650"
                )}
                title="Alternar Tema"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button 
                onClick={() => { window.location.href = '/'; }}
                className={cn(
                  "p-2 rounded-lg transition-colors cursor-pointer",
                  isDark ? "hover:bg-zinc-850 text-zinc-400" : "hover:bg-zinc-100 text-zinc-650"
                )}
                title="Sair do Painel"
              >
                <LogOut size={15} />
              </button>
              {/* Drawer Close Button for Mobile & Tablet */}
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "lg:hidden p-2 rounded-lg transition-colors cursor-pointer ml-1",
                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-150 text-zinc-600"
                )}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800/60 space-y-3">
            {/* Seletor de Status / Pausas */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-widest">
                <span className="text-zinc-500">Status de Pausa (NR17)</span>
                {attendantStatus !== 'available' && (
                  <span className="font-mono text-rose-400 flex items-center gap-1 animate-pulse">
                    ⏱️ {formatTimer(pauseElapsed)}
                  </span>
                )}
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={cn(
                    "w-full rounded-xl p-2.5 text-[11px] text-left outline-none border font-extrabold flex items-center justify-between cursor-pointer transition-colors",
                    isDark ? "bg-zinc-950/80 border-zinc-800/80 text-white hover:border-zinc-700" : "bg-white border-zinc-205 text-zinc-900 shadow-xs"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      attendantStatus === 'available' ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span>
                      {attendantStatus === 'available' && "Disponível"}
                      {attendantStatus === 'nr17' && "Pausa NR17"}
                      {attendantStatus === 'bathroom' && "Banheiro"}
                      {attendantStatus === 'lunch' && "Lanche/Almoço"}
                      {attendantStatus === 'feedback' && "Feedback"}
                      {attendantStatus === 'meeting' && "Reunião"}
                      {attendantStatus === 'support' && "Suporte"}
                    </span>
                  </div>
                  <ChevronDown size={13} className={cn("transition-transform duration-200 text-zinc-500 shrink-0", isStatusDropdownOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {isStatusDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                          "absolute top-full left-0 right-0 mt-1.5 rounded-xl border p-1 shadow-xl z-50 overflow-hidden font-extrabold",
                          isDark ? "bg-zinc-900 border-zinc-805 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                      >
                        {[
                          { value: 'available', label: 'Disponível', color: 'bg-emerald-500' },
                          { value: 'nr17', label: 'Pausa NR17', color: 'bg-rose-500' },
                          { value: 'bathroom', label: 'Banheiro', color: 'bg-rose-500' },
                          { value: 'lunch', label: 'Lanche/Almoço', color: 'bg-rose-500' },
                          { value: 'feedback', label: 'Feedback', color: 'bg-rose-500' },
                          { value: 'meeting', label: 'Reunião', color: 'bg-rose-500' },
                          { value: 'support', label: 'Suporte', color: 'bg-rose-500' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAttendantStatus(opt.value as any);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer",
                              attendantStatus === opt.value
                                ? (isDark ? "bg-emerald-600/20 text-emerald-400" : "bg-emerald-600/10 text-emerald-800")
                                : (isDark ? "hover:bg-zinc-800 text-zinc-350" : "hover:bg-zinc-50 text-zinc-700")
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn("w-1.5 h-1.5 rounded-full", opt.color)} />
                              <span>{opt.label}</span>
                            </div>
                            {attendantStatus === opt.value && (
                              <Check size={12} className="text-emerald-500 shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Sidebar Content Content Section */}
        {activeTab === 'chats' && (
          <>
            {attendantStatus !== 'available' && (
              <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 text-[10px] font-extrabold text-rose-400 text-center animate-pulse flex items-center justify-center gap-1.5 select-none leading-none">
                ⏸️ VOCÊ ESTÁ EM PAUSA ({
                  attendantStatus === 'nr17' ? 'PAUSA NR17' :
                  attendantStatus === 'bathroom' ? 'BANHEIRO' :
                  attendantStatus === 'lunch' ? 'ALMOÇO' :
                  attendantStatus === 'feedback' ? 'FEEDBACK' :
                  attendantStatus === 'meeting' ? 'REUNIÃO' : 'SUPORTE'
                }). ATENDIMENTOS BLOQUEADOS.
              </div>
            )}
            <div className={cn("p-4 border-b shrink-0", isDark ? "border-zinc-800/60" : "border-zinc-150")}>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input 
                    type="text" 
                    placeholder="Buscar conversas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={cn(
                      "w-full border-none rounded-xl py-2 pl-9 pr-4 text-xs outline-none transition-all",
                      isDark ? "bg-zinc-800 text-white focus:ring-1 focus:ring-emerald-500" : "bg-zinc-150 text-zinc-900 focus:ring-1 focus:ring-emerald-500"
                    )}
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  {['all', 'waiting', 'active', 'ended'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer",
                        statusFilter === status 
                          ? "bg-emerald-600 text-white" 
                          : (isDark ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-150 text-zinc-500 hover:text-zinc-800")
                      )}
                    >
                      {status === 'all' ? 'Todos' : status === 'waiting' ? 'Sem Atend' : status === 'active' ? 'Em curso' : 'Finalizados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredRooms.map((room, index) => (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  key={room.room}
                  onClick={() => {
                    if (attendantStatus !== 'available') {
                      alert("Você está em pausa (conforme as regras de governança da NR17). Mude seu status para 'Disponível' para poder assumir e interagir com este atendimento.");
                      return;
                    }
                    setSelectedRoom(room.room);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-start gap-3 transition-all text-left group cursor-pointer",
                    selectedRoom === room.room 
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                      : (isDark ? "hover:bg-zinc-800 bg-zinc-900/15 text-zinc-400" : "hover:bg-zinc-100 bg-zinc-50/40 text-zinc-650")
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 font-extrabold",
                    selectedRoom === room.room ? "bg-white/20 text-white" : (isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-800")
                  )}>
                    {room.userName ? room.userName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={cn(
                        "font-extrabold text-xs truncate",
                        selectedRoom === room.room ? "text-white" : (isDark ? "text-zinc-200" : "text-zinc-900")
                      )}>
                        {room.userName || 'Usuário'}
                      </span>
                      <span className="text-[9px] opacity-70 font-semibold shrink-0 ml-1">
                        {(() => {
                          if (!room.updatedAt) return '';
                          const date = new Date(room.updatedAt);
                          return isNaN(date.getTime()) ? '' : format(date, 'HH:mm');
                        })()}
                      </span>
                    </div>
                    <p className="text-[11px] truncate opacity-75 mb-1.5 leading-snug">
                      {room.lastMessage || 'Sem mensagens'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {room.status === 'waiting' && (
                        <span className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-450/10 px-2 py-0.5 rounded-full">
                          <AlertCircle size={9} /> Aguardando
                        </span>
                      )}
                      {room.status === 'active' && (
                        <span className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-405/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={9} /> Em curso
                        </span>
                      )}
                      {room.status === 'ended' && (
                        <span className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-wider text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">
                          Finalizado
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
              {filteredRooms.length === 0 && (
                <div className="text-center py-12 opacity-35">
                  <MessageSquare className="mx-auto mb-2 text-zinc-500" size={24} />
                  <p className="text-xs">Nenhuma conversa encontrada</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200")}>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                <BarChart3 size={14} className="text-emerald-500" /> Métricas e Analytics
              </h3>
              <p className="text-xs text-zinc-500 leading-normal">
                KPIs do call center digital Anny. Análise de NPS, Retenção por IA com transbordo humano operacional.
              </p>
            </div>
            
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Fluxos Ativos</h4>
              <div className={cn("p-4 rounded-2xl text-xs space-y-3", isDark ? "bg-zinc-900/10" : "bg-zinc-50")}>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-550">Atendimentos</span>
                  <strong className="text-xs font-bold">{rooms.length} sintonizados</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-550">Assistente Anny</span>
                  <strong className="text-xs font-bold text-emerald-500">Sob Escuta</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-550">Aguardando Humano</span>
                  <strong className="text-xs font-bold text-rose-450">{rooms.filter(r => r.status === 'waiting').length}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200")}>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 mb-2 flex items-center gap-1.5">
                <Megaphone size={14} /> Mural de Avisos
              </h3>
              <p className="text-xs text-zinc-400 leading-normal">
                Painel integrado de publicação de informativos operacionais, avisos corporativos e gestão de feedbacks da equipe.
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Métricas da Central</h4>
              <div className={cn("p-4 rounded-2xl text-xs space-y-3", isDark ? "bg-zinc-900/10" : "bg-zinc-50")}>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Comunicados Ativos</span>
                  <strong className="font-bold">{comunicados.length} publicados</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Feedbacks Recebidos</span>
                  <strong className="font-bold">
                    {comunicados.reduce((sum, c) => sum + c.feedbacks.length, 0)} envios
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Responsive Viewport */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 overflow-hidden relative min-w-0 w-full h-full",
        activeTab === 'chats' && !selectedRoom ? "max-md:hidden" : "max-md:flex"
      )}>
        {activeTab === 'chats' ? (
          selectedRoom ? (
            <>
              {attendantStatus !== 'available' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                  <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm space-y-4 shadow-2xl">
                    <AlertTriangle className="mx-auto text-rose-500 animate-bounce" size={40} />
                    <h3 className="font-extrabold text-sm text-zinc-100 uppercase tracking-wider">Atendimento Bloqueado</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Você está em status de <span className="text-rose-455 font-bold">{
                        attendantStatus === 'nr17' ? 'Pausa NR17' :
                        attendantStatus === 'bathroom' ? 'Banheiro' :
                        attendantStatus === 'lunch' ? 'Lanche/Almoço' :
                        attendantStatus === 'feedback' ? 'Feedback' :
                        attendantStatus === 'meeting' ? 'Reunião' : 'Suporte'
                      }</span>.
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Não é permitido enviar ou ler mensagens enquanto persistir o tempo de pausa regido pela governança NR17.
                    </p>
                    <button
                      onClick={() => setAttendantStatus('available')}
                      className="w-full py-2.5 bg-emerald-600 text-white font-extrabold rounded-2xl text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      Voltar para Disponível
                    </button>
                  </div>
                </div>
              )}
              {/* Responsive Chat Header */}
              <div className={cn(
                "p-4 md:p-5 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md shrink-0",
                isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-150"
              )}>
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  {/* Single Unified Return Button (WhatsApp style back navigation) */}
                  <button 
                    onClick={() => {
                      setSelectedRoom(null);
                    }}
                    className={cn(
                      "p-2 px-3 rounded-xl transition-all shrink-0 flex items-center gap-1 text-xs font-extrabold cursor-pointer border shadow-xs select-none",
                      isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700/80 hover:text-white" : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <ChevronLeft size={16} />
                    <span>Voltar</span>
                  </button>

                  {/* Tablet/Mobile Drawer Toggle Button if sidebar hidden */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={cn(
                      "hidden md:max-lg:flex p-2 rounded-xl transition-colors shrink-0 cursor-pointer",
                      isDark ? "hover:bg-zinc-805 text-zinc-400" : "hover:bg-zinc-100 text-zinc-650"
                    )}
                    title="Menu de Atendimentos"
                  >
                    <Menu size={18} />
                  </button>

                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-sm md:text-base font-extrabold text-white uppercase shadow-md shadow-emerald-500/10 shrink-0">
                    {rooms.find(r => r.room === selectedRoom)?.userName?.[0].toUpperCase() || 'U'}
                  </div>
                  
                  <div className="min-w-0">
                    <h2 className={cn("font-extrabold text-base md:text-lg tracking-tight flex items-center gap-1.5", isDark ? "text-white" : "text-zinc-900")}>
                      <span className="truncate">{rooms.find(r => r.room === selectedRoom)?.userName || 'Usuário'}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    </h2>
                    <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono truncate">
                      <Clock size={11} className="shrink-0" /> ID: {selectedRoom}
                    </p>
                  </div>
                </div>

                {/* Elegant three-dots menu dropdown (Gaveta de Ações) */}
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                    className={cn(
                      "p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs",
                      isHeaderDropdownOpen
                        ? (isDark ? "bg-emerald-600/20 border-emerald-500 text-emerald-400" : "bg-emerald-600 border-emerald-600 text-white")
                        : (isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white" : "bg-white border-zinc-200 text-zinc-705 hover:bg-zinc-50")
                    )}
                    title="Ações do Atendimento"
                  >
                    <MoreVertical size={16} />
                  </button>

                  <AnimatePresence>
                    {isHeaderDropdownOpen && (
                      <>
                        {/* Backdrop overlay to dismiss dropdown */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsHeaderDropdownOpen(false)} />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "absolute right-0 mt-2 w-56 rounded-2xl border p-1.5 shadow-2xl z-50 font-sans font-extrabold",
                            isDark ? "bg-zinc-900 border-zinc-850 text-zinc-100" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                        >
                          <button
                            onClick={() => {
                              setIsHeaderDropdownOpen(false);
                              if (attendantStatus !== 'available') return;
                              setShowCRM(!showCRM);
                              setIsRightDrawerOpen(!isRightDrawerOpen);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer",
                              isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50"
                            )}
                          >
                            <User size={15} className="text-emerald-500 shrink-0" />
                            <span>Ver Perfil (CRM)</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsHeaderDropdownOpen(false);
                              if (attendantStatus !== 'available') return;
                              setSelectedTransferAttendant('');
                              setShowTransferModal(true);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer",
                              isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50"
                            )}
                          >
                            <ArrowLeftRight size={15} className="text-emerald-500 shrink-0" />
                            <span>Transferir Atendimento</span>
                          </button>

                          <div className={cn("h-px my-1.5", isDark ? "bg-zinc-800" : "bg-zinc-150")} />

                          <button
                            onClick={() => {
                              setIsHeaderDropdownOpen(false);
                              if (attendantStatus !== 'available') return;
                              setSelectedClosureReason('');
                              setShowClosureModal(true);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-rose-500",
                              isDark ? "hover:bg-rose-500/10" : "hover:bg-rose-50"
                            )}
                          >
                            <X size={15} className="shrink-0" />
                            <span>Encerrar Atendimento</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Chat Split Area: Messages and CRM Sidepanel */}
              <div className="flex-1 flex overflow-hidden relative w-full">
                
                {/* Messages Viewport */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden h-full min-w-0">
                  <div className={cn(
                    "flex-1 overflow-y-auto p-4 md:p-6 space-y-5",
                    isDark ? "bg-zinc-950" : "bg-zinc-50"
                  )}>
                    {messages.map((msg, i) => {
                      const hasReply = !!msg.replyTo;
                      const isMe = msg.sender === 'admin';
                      return (
                        <div key={i} className={cn(
                          "flex w-full",
                          isMe ? "justify-end" : "justify-start"
                        )}>
                          <div 
                            onClick={() => {
                              if (msg.isSystem) return;
                              setActiveMsgMenuIndex(activeMsgMenuIndex === i ? null : i);
                            }}
                            className={cn(
                              "relative group max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-xs md:text-sm shadow-xs cursor-pointer select-none transition-all",
                              isMe 
                                ? "bg-emerald-600 text-white rounded-tr-none shadow-emerald-800/10 hover:bg-emerald-700/90" 
                                : (isDark ? "bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800 hover:bg-zinc-850" : "bg-white text-zinc-900 rounded-tl-none border border-zinc-100/80 hover:bg-zinc-50"),
                              msg.isSystem && "bg-zinc-900/30 text-zinc-500 italic text-center w-full max-w-none rounded-xl shadow-none border border-zinc-800/50 cursor-default"
                            )}
                            style={{ fontSize: msg.isSystem ? undefined : `${chatFontSize}px` }}
                          >
                            {!msg.isSystem && (
                              <p className="font-extrabold text-[9px] mb-1.5 opacity-60 uppercase tracking-widest flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1">
                                  {isMe ? 'Você' : (msg.sender === 'Anny' ? 'Anny (Assistente IA)' : (rooms.find(r => r.room === selectedRoom)?.userName || 'Usuário'))}
                                  {msg.sender === 'Anny' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                </span>
                              </p>
                            )}

                            {/* Reply Reference Preview (WhatsApp style quote) */}
                            {hasReply && (
                              <div className={cn(
                                "mb-2 p-2 rounded-lg border-l-4 text-xs font-semibold flex flex-col gap-0.5 select-none",
                                isMe 
                                  ? "bg-black/15 border-emerald-400 text-zinc-100" 
                                  : (isDark ? "bg-zinc-950/50 border-emerald-500 text-zinc-350" : "bg-zinc-100 border-emerald-500 text-zinc-650")
                              )}>
                                <span className="font-extrabold text-[9px] opacity-75 uppercase">Mensagem Respondida</span>
                                <p className="truncate line-clamp-1 italic">{msg.replyTo}</p>
                              </div>
                            )}

                            {/* File Sharing content */}
                            {msg.fileData && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-white/5 bg-black/10">
                                {msg.fileType?.startsWith('image/') ? (
                                  <img src={msg.fileData} alt="Shared" className="max-w-full h-auto" referrerPolicy="no-referrer" />
                                ) : msg.fileType?.startsWith('video/') ? (
                                  <video src={msg.fileData} controls className="max-w-full h-auto" />
                                ) : null}
                              </div>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            
                            <p className="text-[9px] opacity-45 mt-1 text-right font-extrabold">
                              {format(new Date(msg.timestamp), 'HH:mm')}
                            </p>

                            {/* Contextual click dropdown options */}
                            <AnimatePresence>
                              {activeMsgMenuIndex === i && (
                                <>
                                  <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setActiveMsgMenuIndex(null); }} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.1 }}
                                    className={cn(
                                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 rounded-xl p-1 shadow-2xl border z-50 flex flex-col gap-0.5 font-extrabold",
                                      isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-200 text-zinc-900"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setReplyingToMessage({ i, ...msg });
                                        setEditingMessage(null);
                                        setInput('');
                                        setActiveMsgMenuIndex(null);
                                      }}
                                      className={cn(
                                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wide transition-colors cursor-pointer",
                                        isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                                      )}
                                    >
                                      Responder
                                    </button>
                                    {isMe && (
                                      <button
                                        onClick={() => {
                                          setEditingMessage({ index: i, text: msg.text });
                                          setReplyingToMessage(null);
                                          setInput(msg.text);
                                          setActiveMsgMenuIndex(null);
                                        }}
                                        className={cn(
                                          "w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wide transition-colors cursor-pointer text-emerald-500",
                                          isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                                        )}
                                      >
                                        Editar
                                      </button>
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* WhatsApp style Reply / Edit Metadata Context Banner attached above writing field */}
                  <AnimatePresence>
                    {(replyingToMessage || editingMessage) && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        className={cn(
                          "px-4 py-2.5 border-t border-b shrink-0 flex items-center justify-between gap-3 text-xs select-none",
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-350 bg-zinc-950/20" : "bg-zinc-50 border-zinc-200 text-zinc-700 bg-zinc-100/30"
                        )}
                      >
                        <div className="flex-1 min-w-0 border-l-4 border-emerald-500 pl-3">
                          <p className="font-extrabold text-[10px] uppercase text-emerald-400 tracking-wider">
                            {editingMessage ? "Editando mensagem" : `Respondendo a ${replyingToMessage?.sender === 'admin' ? 'si mesmo' : (replyingToMessage?.sender === 'Anny' ? 'Anny' : (rooms.find(r => r.room === selectedRoom)?.userName || 'Usuário'))}`}
                          </p>
                          <p className="truncate line-clamp-1 text-[11px] font-medium leading-relaxed mt-0.5 opacity-80 italic">
                            {editingMessage ? editingMessage.text : replyingToMessage?.text}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setReplyingToMessage(null);
                            setEditingMessage(null);
                            setInput('');
                          }}
                          className={cn(
                            "p-1.5 rounded-full hover:scale-105 active:scale-95 transition-all text-zinc-400 hover:text-rose-455 shrink-0",
                            isDark ? "bg-zinc-800 hover:bg-rose-500/10" : "bg-zinc-250 hover:bg-rose-50"
                          )}
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message Input Box */}
                  <div className={cn(
                    "p-4 border-t shrink-0",
                    isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white border-zinc-150"
                  )}>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!input.trim()) return;

                        if (editingMessage) {
                          setMessages(prev => prev.map((m, idx) => {
                            if (idx === editingMessage.index) {
                              return { ...m, text: input };
                            }
                            return m;
                          }));
                          setEditingMessage(null);
                        } else {
                          const quote = replyingToMessage ? replyingToMessage.text : undefined;
                          handleSendMessage(input, undefined, quote);
                          setReplyingToMessage(null);
                        }
                        setInput('');
                      }} 
                      className="flex gap-2"
                    >
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua resposta em tempo real..."
                        className={cn(
                          "flex-1 border-none rounded-xl p-3 text-xs md:text-sm outline-none transition-all",
                          isDark ? "bg-zinc-800 text-white focus:ring-1 focus:ring-emerald-500" : "bg-zinc-100 text-zinc-900 focus:ring-1 focus:ring-emerald-500"
                        )}
                        style={{ fontSize: `${chatFontSize}px` }}
                      />
                      <label className={cn(
                        "p-3 rounded-xl cursor-pointer active:scale-95 transition-all text-zinc-400 hover:text-zinc-200 flex items-center justify-center shrink-0",
                        isDark ? "bg-zinc-800 hover:bg-zinc-700/80" : "bg-zinc-100 hover:bg-zinc-200/80"
                      )}>
                        <Paperclip size={18} />
                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      </label>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center shrink-0"
                      >
                        <Send size={18} />
                      </motion.button>
                    </form>
                  </div>
                </div>

                {/* CRM Client Profile Sidebar & Drawer Panel */}
                {(() => {
                  const client = getClientCRMContext(
                    rooms.find(r => r.room === selectedRoom)?.userName, 
                    selectedRoom
                  );
                  return (
                    <AnimatePresence>
                      {(showCRM || isRightDrawerOpen) && (
                        <>
                          {/* Drawer Backdrop Overlay (Mobile/Tablet only) */}
                          {isRightDrawerOpen && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.5 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setIsRightDrawerOpen(false)}
                              className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
                            />
                          )}

                          <motion.div 
                            initial={{ x: '100%', opacity: 0.8 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.8 }}
                            transition={{ type: "tween", duration: 0.25 }}
                            className={cn(
                              "fixed inset-y-0 right-0 z-50 w-80 border-l flex flex-col shrink-0 h-full overflow-y-auto p-5 space-y-5 shadow-2xl transition-all",
                              isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-205",
                              "lg:relative lg:translate-x-0 lg:z-0 lg:shadow-none lg:flex",
                              !showCRM && "lg:hidden"
                            )}
                          >
                            <div className="flex items-center justify-between border-b pb-3 border-zinc-850">
                              <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <User size={14} /> Perfil do Cliente CRM
                              </h3>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 select-none">
                                  {client.financialStatus}
                                </span>
                                <button 
                                  onClick={() => {
                                    setShowCRM(false);
                                    setIsRightDrawerOpen(false);
                                  }}
                                  className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 cursor-pointer"
                                  title="Recolher Perfil"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4 text-xs">
                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 block">ID do Usuário</span>
                                <p className="font-mono text-[11px] text-zinc-400 font-bold select-all truncate">
                                  {client.userId}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Nome Completo</span>
                                <p className={cn("font-bold text-[13px]", isDark ? "text-zinc-100" : "text-zinc-900")}>
                                  {client.fullName}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Contato E-mail</span>
                                <p className="font-mono text-[11px] text-zinc-400 select-all">
                                  {client.email}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className={cn("p-2.5 rounded-xl border", isDark ? "bg-zinc-950/40 border-zinc-800/60" : "bg-white border-zinc-200")}>
                                  <span className="text-[8px] font-extrabold uppercase tracking-wide text-zinc-500 block mb-0.5">Saldo em Conta</span>
                                  <span className="font-extrabold text-emerald-400 text-[12px]">{client.balance}</span>
                                </div>
                                <div className={cn("p-2.5 rounded-xl border", isDark ? "bg-zinc-950/40 border-zinc-800/60" : "bg-white border-zinc-200")}>
                                  <span className="text-[8px] font-extrabold uppercase tracking-wide text-zinc-500 block mb-0.5">Gasto Mensal</span>
                                  <span className="font-extrabold text-rose-450 text-[12px]">{client.expenses}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5 animate-fade-in">
                                <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500 block">Perfil de Investidor</span>
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider border uppercase",
                                  client.investorProfile === 'Conservador' && "bg-blue-600/10 text-blue-400 border-blue-500/20",
                                  client.investorProfile === 'Moderado' && "bg-amber-600/10 text-amber-400 border-amber-500/20",
                                  client.investorProfile === 'Arrojado' && "bg-violet-600/10 text-violet-400 border-violet-500/20"
                                )}>
                                  ● {client.investorProfile}
                                </span>
                              </div>

                              {/* CRM Dynamic Annotations Form */}
                              <div className="space-y-1.5 pt-3 border-t border-zinc-800/40">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 block">
                                  Anotações do Atendente
                                </span>
                                <textarea
                                  rows={4}
                                  placeholder="Escreva anotações gerais sobre o investidor. Os dados são salvos em tempo real no navegador..."
                                  value={clientNotes[selectedRoom || ''] || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setClientNotes(prev => ({
                                      ...prev,
                                      [selectedRoom]: value
                                    }));
                                  }}
                                  className={cn(
                                    "w-full text-xs p-3 rounded-xl outline-none resize-none transition-all leading-relaxed border",
                                    isDark ? "bg-zinc-950 border-zinc-850 text-zinc-200 focus:ring-1 focus:ring-emerald-500" : "bg-white border-zinc-200 text-zinc-700 focus:ring-1 focus:ring-emerald-500"
                                  )}
                                />
                                <div className="text-[9px] text-zinc-500 flex items-center gap-1.5 font-extrabold">
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  <span>Controle persistente local</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  );
                })()}

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-45">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm",
                isDark ? "bg-zinc-900 text-zinc-300" : "bg-zinc-250 text-zinc-700"
              )}>
                <MessageSquare size={30} />
              </div>
              <h2 className="text-base font-extrabold mb-1">Selecione uma Conversa Ativa</h2>
              <p className="max-w-xs text-xs text-zinc-500 leading-normal">Escolha um cliente da barra à esquerda para visualizar as anotações, histórico e assumir o controle da IA.</p>
            </div>
          )
        ) : activeTab === 'analytics' ? (
          /* Operational Metrics, BI & Governance Reports combined under BI tab */
          (() => {
            if (currentRole === 'atendente') {
              return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none animate-fade-in">
                  <AlertTriangle className="text-amber-500 animate-bounce mb-3" size={32} />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-300">Acesso Restrito ao Gestor</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-normal">
                    Seu perfil de Atendente não possui os privilégios estipulados de governança para auditar relatórios e métricas de desempenho.
                  </p>
                </div>
              );
            }

            const totalRoomsForBI = rooms.length;
            const waitingRoomsForBI = rooms.filter(r => r.status === 'waiting').length;
            const activeRoomsForBI = rooms.filter(r => r.status === 'active').length;
            const endedRoomsForBI = rooms.filter(r => r.status === 'ended').length;

            const totalDayChats = totalRoomsForBI + 32; // base offset for realistic analytics

            const calculateTMAShort = () => {
              const endedKeys = Object.keys(roomSupportTimes).filter(room => {
                const times = roomSupportTimes[room];
                return times && times.start && times.end && rooms.some(r => r.room === room && r.status === 'ended');
              });
              
              if (endedKeys.length === 0) {
                return '4.8 min';
              }
              
              let totalMs = 0;
              endedKeys.forEach(room => {
                const times = roomSupportTimes[room];
                const diff = new Date(times.end!).getTime() - new Date(times.start!).getTime();
                totalMs += diff;
              });
              
              const averageMin = (totalMs / endedKeys.length) / (1000 * 60);
              return `${averageMin.toFixed(1)} min`;
            };

            const retentionPercentageForBI = totalRoomsForBI > 0 
              ? Math.round((endedRoomsForBI / totalRoomsForBI) * 100) 
              : 100;

            const activePercentageForBI = totalRoomsForBI > 0
              ? Math.round((activeRoomsForBI / totalRoomsForBI) * 100)
              : 0;

            const waitingPercentageForBI = totalRoomsForBI > 0
              ? Math.max(0, 100 - retentionPercentageForBI - activePercentageForBI)
              : 0;

            const tmeAvg = '1.4 min';

            return (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-805 pb-5">
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => setIsMobileMenuOpen(true)}
                      className="lg:hidden p-2 rounded-xl transition-colors hover:bg-zinc-850 text-zinc-400 shrink-0 cursor-pointer"
                      title="Menu"
                    >
                      <Menu size={20} />
                    </button>
                    <div>
                      <h2 className={cn("text-base md:text-xl font-extrabold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                        Métricas de Performance & BI (Governança)
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        Resumo operacional consolidado, tabulações obrigatórias e tempos de pausa (NR17) em tempo real.
                      </p>
                    </div>
                  </div>
                  <div className="p-1 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-extrabold text-[10px] uppercase shrink-0 self-start md:self-center">
                    Acesso {currentRole === 'admin' ? 'Administrador' : 'Supervisor'}
                  </div>
                </div>

                {/* PAINEL DE DESEMPENHO DO DIA */}
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                    <Activity size={14} /> KPI de Desempenho e Retenção
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total de Atendimentos */}
                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-300",
                      isDark ? "bg-zinc-900/30 border-zinc-800/80" : "bg-white border-zinc-200 shadow-xs"
                    )}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Total de Atendimentos</span>
                      <strong className={cn("text-2xl font-extrabold block", isDark ? "text-white" : "text-zinc-950")}>
                        {totalDayChats}
                      </strong>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Somatório de chats resolvidos por inteligência artificial e transbordos humanos hoje.
                      </p>
                    </div>

                    {/* Retenção */}
                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-300",
                      isDark ? "bg-zinc-900/30 border-zinc-800/80" : "bg-white border-zinc-200 shadow-xs"
                    )}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Taxa de Retenção IA</span>
                      <strong className="text-2xl font-extrabold text-emerald-500 block">
                        {retentionPercentageForBI}%
                      </strong>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        {endedRoomsForBI} atendimentos resolvidos com triagem automatizada da assistente Anny.
                      </p>
                    </div>

                    {/* TMA */}
                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-300",
                      isDark ? "bg-zinc-900/30 border-zinc-800/80" : "bg-white border-zinc-200 shadow-xs"
                    )}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Tempo de Conversa (TMA)</span>
                      <strong className={cn("text-2xl font-extrabold block", isDark ? "text-white" : "text-zinc-950")}>
                        {calculateTMAShort()}
                      </strong>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Tempo médio real de atendimento ativo sob custódia dos operadores corporativos.
                      </p>
                    </div>

                    {/* TME */}
                    <div className={cn(
                      "p-5 rounded-2xl border transition-all duration-300",
                      isDark ? "bg-zinc-900/30 border-zinc-800/80" : "bg-white border-zinc-200 shadow-xs"
                    )}>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block mb-1">Tempo de Fila (TME)</span>
                      <strong className="text-2xl font-extrabold text-amber-500 block">
                        {tmeAvg}
                      </strong>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Tempo médio que o investidor aguarda na fila de transbordo por uma resposta humana.
                      </p>
                    </div>
                  </div>
                </div>

                {/* TWO-COLUMN LAYOUT: SPARKLINE GRID & TABULATIONS SUMMARY */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* MOTIVOS DE ENCERRAMENTO MAIS UTILIZADOS */}
                  <div className={cn(
                    "p-5 rounded-2xl border space-y-4",
                    isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
                  )}>
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                        Resumo da Tabulação: Motivos de Encerramento (NR17)
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Auditoria de motivos selecionados obrigatoriamente pelos atendentes ao finalizar chamados.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div className="space-y-3.5 text-xs">
                        {Object.entries(closureCounts).map(([motive, count]) => {
                          const total = (Object.values(closureCounts) as number[]).reduce((a, b) => a + b, 0) || 1;
                          const pct = Math.round(((count as number) / total) * 100);
                          return (
                            <div key={motive} className="space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>{motive}</span>
                                <span className={isDark ? "text-emerald-400" : "text-emerald-700"}>{count as number} ({pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-805 rounded-lg overflow-hidden flex">
                                <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Doughnut metric placeholder graph */}
                      <div className="flex flex-col items-center justify-center p-4 border border-zinc-800/40 bg-zinc-950/20 rounded-xl">
                        <div className="w-20 h-20 rounded-full border-8 border-emerald-500 flex items-center justify-center font-extrabold text-sm text-center">
                          <div>
                            <span className="block text-lg">{(Object.values(closureCounts) as number[]).reduce((a, b) => a + b, 0)}</span>
                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">Total</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-2 text-center leading-relaxed">
                          Distribuição de tabulações consolidadas no dia em tempo real.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SPARKLINE GRAPH OF CALL PEAK HOURS */}
                  <div className={cn(
                    "p-5 rounded-2xl border space-y-4",
                    isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                          Volume e Demanda de Atendimentos
                        </h3>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Curva de engajamento do cliente por horários de pico.
                        </p>
                      </div>
                      <div className="w-24 h-10 shrink-0">
                        <svg viewBox="0 0 100 30" className="w-full h-full text-emerald-500">
                          <defs>
                            <linearGradient id="sparkGradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path 
                            d="M 0,25 Q 12.5,15 25,20 T 50,5 T 75,25 T 100,10" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 0,25 Q 12.5,15 25,20 T 50,5 T 75,25 T 100,10 L 100,30 L 0,30 Z" 
                            fill="url(#sparkGradient2)" 
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Fluxo Retido na Assistente IA Anny</span>
                          <span className="text-emerald-450">{retentionPercentageForBI}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-855 rounded-lg overflow-hidden flex">
                          <div className="h-full bg-emerald-500" style={{ width: `${retentionPercentageForBI}%` }} />
                          <div className="h-full bg-zinc-700" style={{ width: `${100 - retentionPercentageForBI}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Transbordo p/ Equipes de Suporte</span>
                          <span className="text-amber-450">{activePercentageForBI}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-855 rounded-lg overflow-hidden flex">
                          <div className="h-full bg-amber-500" style={{ width: `${activePercentageForBI}%` }} />
                          <div className="h-full bg-zinc-700" style={{ width: `${100 - activePercentageForBI}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUDITORIA DE ESCALA E LOGS DE PAUSA (NR17) */}
                <div className={cn(
                  "p-5 rounded-2xl border space-y-4",
                  isDark ? "bg-zinc-900/30 border-zinc-800" : "bg-white border-zinc-200 shadow-xs"
                )}>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                      Auditoria de Escalas e Auditoria de Pausas NR17
                    </h3>
                    <p className="text-[11px] text-zinc-505 mt-1">
                      Monitoramento de tempos e conformidade de descanso em acordo para prevenção de LER/DORT (NR17).
                    </p>
                  </div>

                  <div className="overflow-x-auto w-full no-scrollbar">
                    <table className="w-full text-left text-xs text-zinc-400 leading-normal min-w-[500px]">
                      <thead>
                        <tr className={cn("border-b font-extrabold uppercase text-[9px] tracking-wider", isDark ? "border-zinc-805 text-zinc-500" : "border-zinc-200 text-zinc-650")}>
                          <th className="py-2.5 px-3">Atendente</th>
                          <th className="py-2.5 px-3">Horário de Login</th>
                          <th className="py-2.5 px-3">Horário de Logout</th>
                          <th className="py-2.5 px-3">Subtotal de Pausas</th>
                          <th className="py-2.5 px-3 text-right">Status Atual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/40">
                        {scaleLogs.map((log) => {
                          const h = Math.floor(log.pauseDuration / 3600);
                          const m = Math.floor((log.pauseDuration % 3600) / 60);
                          const s = log.pauseDuration % 60;
                          const pauseFormatted = `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
                          
                          // Determine is active user log
                          const isActiveUser = log.attendant === 'Você Atendente';
                          
                          return (
                            <tr key={log.id} className={cn(isDark ? "hover:bg-zinc-800/15" : "hover:bg-zinc-100/30")}>
                              <td className={cn("py-3 px-3 font-semibold flex items-center gap-1.5", isDark ? "text-zinc-100" : "text-zinc-950")}>
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                {log.attendant}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px]">{log.loginTime}</td>
                              <td className="py-3 px-3 font-mono text-[11px]">{log.logoutTime}</td>
                              <td className="py-3 px-3 font-mono text-[11px] font-bold text-rose-400">{pauseFormatted}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={cn(
                                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border",
                                  isActiveUser 
                                    ? (attendantStatus === 'available' ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" : "bg-rose-600/10 text-rose-400 border-rose-500/20")
                                    : "bg-emerald-600/10 text-emerald-400 border-emerald-500/20"
                                )}>
                                  ● {isActiveUser 
                                      ? (attendantStatus === 'available' ? 'Disponível' : 'Em Pausa') 
                                      : 'Ativo'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()
        ) : activeTab === 'config' ? (
          /* CONFIGURAÇÃO TAB PANEL DISPLAY */
          /* Custom Font size configurations and dynamic Operator Creation Form according to hierarchy rules */
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-805 pb-5">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl transition-colors hover:bg-zinc-805 text-zinc-400 shrink-0 cursor-pointer"
                  title="Menu"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className={cn("text-base md:text-xl font-extrabold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                    Painel de Configuração e Governança
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Ajustes de interface do operador, simulador de carga operacional e criação hierárquica de contas de governança.
                  </p>
                </div>
              </div>
              <div className="p-1 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-extrabold text-[10px] uppercase shrink-0 self-start md:self-center">
                Configurações
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              {/* Left Column: Editor Preferences */}
              <div className="space-y-6">
                {/* Preferências de Leitura Card */}
                <div className={cn(
                  "p-5 md:p-6 rounded-2xl border space-y-4",
                  isDark ? "bg-zinc-900/30 border-zinc-805" : "bg-white border-zinc-200 shadow-xs"
                )}>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                    <Sliders size={14} /> Preferências de Leitura do Atendente
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold block">Tamanho da Fonte das Mensagens</span>
                        <span className="text-zinc-505 text-[11px] block mt-0.5">Mude a legibilidade de conversas ativas</span>
                      </div>
                      <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-mono font-bold rounded-lg shrink-0 select-none">
                        {chatFontSize}px
                      </span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <input 
                        type="range" 
                        min={11} 
                        max={16} 
                        step={1}
                        value={chatFontSize}
                        onChange={(e) => setChatFontSize(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500 font-bold px-0.5 select-none">
                        <span>Compacto (11px)</span>
                        <span>Mediano (13px)</span>
                        <span>Amplo (16px)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulador de Perfil Operacional Card */}
                <div className={cn(
                  "p-5 md:p-6 rounded-2xl border space-y-4",
                  isDark ? "bg-zinc-900/30 border-zinc-805" : "bg-white border-zinc-200 shadow-xs"
                )}>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                      <UserCheck size={14} /> Simulador de Perfil Operacional
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Alternar papéis em tempo real para fins de governança, testes e auditoria de visibilidade.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'admin', label: 'Admin' },
                      { id: 'supervisor', label: 'Supervisão' },
                      { id: 'atendente', label: 'Atendente' }
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setCurrentRole(role.id as any);
                          if (role.id === 'atendente' && activeTab === 'analytics') {
                            setActiveTab('chats');
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center text-center justify-center gap-2 font-extrabold transition-all cursor-pointer select-none",
                          currentRole === role.id
                            ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/10 scale-[1.01]"
                            : (isDark ? "bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-50 border-zinc-150 text-zinc-650 hover:bg-zinc-100")
                        )}
                      >
                        <UserCheck size={16} />
                        <span className="text-[10px] leading-tight">{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: User Administration Section (Governança / Cadastro de Usuários) */}
              <div className="space-y-6">
                <div className={cn(
                  "p-5 md:p-6 rounded-2xl border space-y-4",
                  isDark ? "bg-zinc-900/30 border-zinc-805" : "bg-white border-zinc-200 shadow-xs"
                )}>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                      <Plus size={14} /> Novo Cadastro de Usuário / Operador
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Cadastro de contas operacionais restrito por cargo de governança.
                    </p>
                  </div>

                  {currentRole !== 'admin' ? (
                    <div className="p-4 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-orange-400 animate-fade-in">
                      <AlertTriangle className="shrink-0 mt-0.5 animate-pulse" size={16} />
                      <div>
                        <strong className="font-extrabold block mb-0.5">Recurso Restrito ao Admin</strong>
                        <span>O seu perfil atual (<span className="uppercase font-extrabold">{currentRole}</span>) não possui privilégios administrativos para cadastrar novos operadores no sistema.</span>
                      </div>
                    </div>
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newOperatorName.trim() || !newOperatorEmail.trim()) return;
                        
                        setOperatorSuccessMsg(`Sucesso! Operador "${newOperatorName}" cadastrado com perfil de ${newOperatorRole.toUpperCase()}!`);
                        setNewOperatorName('');
                        setNewOperatorEmail('');
                        
                        setTimeout(() => {
                          setOperatorSuccessMsg(null);
                        }, 5000);
                      }}
                      className="space-y-4 text-xs animate-fade-in"
                    >
                      {operatorSuccessMsg && (
                        <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-extrabold animate-pulse">
                          {operatorSuccessMsg}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Nome do Operador</label>
                        <input 
                          type="text"
                          required
                          placeholder="Ex: Amanda Silva"
                          value={newOperatorName}
                          onChange={(e) => setNewOperatorName(e.target.value)}
                          className={cn(
                            "w-full rounded-xl p-3 outline-none border transition-all text-xs font-semibold",
                            isDark ? "bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700" : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-350"
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">E-mail Corporativo</label>
                        <input 
                          type="email"
                          required
                          placeholder="Ex: amanda.silva@warren.com.br"
                          value={newOperatorEmail}
                          onChange={(e) => setNewOperatorEmail(e.target.value)}
                          className={cn(
                            "w-full rounded-xl p-3 outline-none border transition-all text-xs font-semibold",
                            isDark ? "bg-zinc-950 border-zinc-805 text-white focus:border-zinc-700" : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-350"
                          )}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-505 block font-bold">Nível de Acesso (Cargo)</label>
                        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50">
                          {[
                            { id: 'admin', label: 'Admin' },
                            { id: 'supervisor', label: 'Supervisor' },
                            { id: 'atendente', label: 'Atendente' }
                          ].map((role) => (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => setNewOperatorRole(role.id as any)}
                              className={cn(
                                "py-2 rounded-lg text-[10px] font-extrabold transition-all text-center cursor-pointer select-none",
                                newOperatorRole === role.id 
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-550 hover:text-zinc-800")
                              )}
                            >
                              {role.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-500 transition-all cursor-pointer shadow-md shadow-emerald-500/10 mt-1"
                      >
                        Salvar e Cadastrar Usuário
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Segmented Mass Broadcaster & Curadoria combined panel */
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-805 pb-5">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-xl transition-colors hover:bg-zinc-805 text-zinc-400 shrink-0 cursor-pointer"
                  title="Menu"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h2 className={cn("text-base md:text-xl font-extrabold tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                    Central de Comunicação
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mural corporativo de avisos, atualizações oficiais, manutenções e engajamento da equipe.
                  </p>
                </div>
              </div>
              <div className="p-1 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-extrabold text-[10px] uppercase shrink-0 self-start md:self-center">
                Mural Ativo
              </div>
            </div>

            {/* GRID LAYOUT: Stacks on mobile/tablet, 2-cols for admin on desktop */}
            <div className={cn(
              "grid gap-6 items-start w-full",
              currentRole === 'admin' ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
            )}>
              
              {/* COMPONENT: FORMULARIO DE CRIACAO DE AVISOS (Admin Only) */}
              {currentRole === 'admin' && (
                <div className={cn(
                  "p-5 md:p-6 rounded-2xl border space-y-4 shadow-sm",
                  isDark ? "bg-zinc-900/30 border-zinc-805" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <Megaphone size={14} className="shrink-0" /> Publicar Novo Comunicado
                    </h3>
                    {newNoticeSuccess && (
                      <span className="text-[10px] font-bold text-emerald-450 animate-pulse">
                        ✓ Publicado!
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block">Categoria do Comunicado</label>
                      <div className="flex gap-2">
                        {(['Aviso', 'Atualização', 'Manutenção'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewNoticeCategory(cat)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer",
                              newNoticeCategory === cat
                                ? (cat === 'Atualização' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' 
                                   : cat === 'Manutenção' ? 'bg-rose-600/20 border-rose-500 text-rose-450'
                                   : 'bg-amber-600/20 border-amber-500 text-amber-500')
                                : (isDark ? 'bg-zinc-950/20 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-650')
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block animate-fade-in">Título do Comunicado</label>
                      <input 
                        type="text"
                        value={newNoticeTitle}
                        onChange={(e) => setNewNoticeTitle(e.target.value)}
                        placeholder="Ex: ⚠️ Instabilidade no Processamento de Transferências"
                        className={cn(
                          "w-full rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500 border",
                          isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                        )}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 block animate-fade-in">Conteúdo do Informativo</label>
                      <textarea 
                        rows={6}
                        value={newNoticeContent}
                        onChange={(e) => setNewNoticeContent(e.target.value)}
                        placeholder="Digite os detalhes do aviso de forma objetiva para toda a equipe de atendimento..."
                        className={cn(
                          "w-full rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none leading-relaxed border",
                          isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                        )}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!newNoticeTitle.trim() || !newNoticeContent.trim()}
                      className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-555 disabled:opacity-50 text-white rounded-xl shadow-md font-extrabold transition-all text-xs cursor-pointer text-center flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Plus size={14} /> Publicar Informativo
                    </button>
                  </form>
                </div>
              )}

              {/* COMPONENT: MURAL DOS COMUNICADOS ATIVOS */}
              <div className="space-y-6">
                <div className={cn(
                  "p-5 md:p-6 rounded-2xl border space-y-4",
                  isDark ? "bg-zinc-900/10 border-zinc-805" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Megaphone size={14} /> Mural de Comunicados Ativos ({comunicados.length})
                    </h3>
                  </div>

                  <div className="space-y-6 max-h-[800px] overflow-y-auto pr-1">
                    {comunicados.length === 0 ? (
                      <div className="text-center py-10 space-y-2 text-zinc-500 border border-dashed border-zinc-100 rounded-2xl">
                        <Megaphone className="mx-auto text-zinc-600 animate-pulse" size={32} />
                        <p className="text-xs font-bold font-mono">Nenhum comunicado ativo no momento.</p>
                      </div>
                    ) : (
                      comunicados.map((comunicado) => {
                        const currentRating = newFeedbacks[comunicado.id]?.rating || 0;
                        const currentComment = newFeedbacks[comunicado.id]?.comment || '';

                        return (
                          <div 
                            key={comunicado.id}
                            className={cn(
                              "p-5 rounded-2xl border space-y-4 shadow-sm",
                              isDark ? "bg-zinc-900/30 border-zinc-850" : "bg-zinc-50 border-zinc-200"
                            )}
                          >
                            {/* Card Header: Category badge & Date */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1.5">
                                <span className={cn(
                                  "text-[8px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md border",
                                  comunicado.category === 'Atualização' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  comunicado.category === 'Manutenção' ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' :
                                  'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                )}>
                                  {comunicado.category}
                                </span>
                                <h4 className={cn("text-xs md:text-sm font-extrabold leading-snug tracking-tight", isDark ? "text-zinc-100" : "text-zinc-900")}>
                                  {comunicado.title}
                                </h4>
                              </div>
                              <span className="text-[10px] text-zinc-550 font-bold font-mono shrink-0 select-none">
                                {comunicado.date}
                              </span>
                            </div>

                            {/* Card Body */}
                            <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-350" : "text-zinc-650")}>
                              {comunicado.content}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-zinc-500 select-none">
                              <span className="font-bold">Publicado por: {comunicado.author}</span>
                              {/* Option for Admin to delete a notification */}
                              {currentRole === 'admin' && (
                                <button
                                  onClick={() => {
                                    if(confirm('Deseja realmente remover este comunicado do mural?')) {
                                      setComunicados(prev => prev.filter(c => c.id !== comunicado.id));
                                    }
                                  }}
                                  className="text-rose-500 font-bold hover:underline cursor-pointer"
                                >
                                  Remover Aviso
                                </button>
                              )}
                            </div>

                            <hr className={cn("border-t", isDark ? "border-zinc-800" : "border-zinc-200")} />

                            {/* Feedbacks Assessment Form (Interactive 1-5 Star Selection & Optional Comment) */}
                            <div className="space-y-3">
                              <p className={cn("text-[10px] font-extrabold uppercase tracking-widest text-zinc-500")}>
                                Enviar Feedback Operacional
                              </p>
                              
                              <div className="flex items-center gap-3 flex-wrap">
                                {/* Interactive Star Rating Row */}
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => {
                                        setNewFeedbacks(prev => ({
                                          ...prev,
                                          [comunicado.id]: {
                                            ...(prev[comunicado.id] || { rating: 0, comment: '' }),
                                            rating: star
                                          }
                                        }));
                                      }}
                                      className="p-1 transition-transform hover:scale-125 cursor-pointer text-zinc-400"
                                      title={`Avaliar com ${star} estrelas`}
                                    >
                                      <Star 
                                        size={18} 
                                        className={cn(
                                          "transition-colors",
                                          star <= currentRating 
                                            ? "fill-amber-450 text-amber-400" 
                                            : (isDark ? "text-zinc-700 hover:text-amber-300" : "text-zinc-300 hover:text-amber-400")
                                        )} 
                                      />
                                    </button>
                                  ))}
                                </div>

                                <input
                                  type="text"
                                  placeholder="Comentário (Opcional)..."
                                  value={currentComment}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewFeedbacks(prev => ({
                                      ...prev,
                                      [comunicado.id]: {
                                        ...(prev[comunicado.id] || { rating: 0, comment: '' }),
                                        comment: val
                                      }
                                    }));
                                  }}
                                  className={cn(
                                    "flex-grow min-w-[150px] rounded-xl px-3 py-1.5 text-xs outline-none border transition-all",
                                    isDark ? "bg-zinc-950 border-zinc-800 text-white focus:border-zinc-700" : "bg-white border-zinc-200 text-zinc-900 focus:border-zinc-300"
                                  )}
                                />

                                <button
                                  type="button"
                                  onClick={() => handleAddFeedback(comunicado.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white rounded-xl text-[11px] transition-colors cursor-pointer active:scale-95 shadow-md shadow-emerald-500/15"
                                >
                                  Enviar Avaliação
                                </button>
                              </div>
                            </div>

                            {/* Submitted Feedback List */}
                            {comunicado.feedbacks && comunicado.feedbacks.length > 0 && (
                              <div className="pt-2 space-y-2 animate-fade-in">
                                <h5 className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-550 select-none">
                                  Comentários da Equipe ({comunicado.feedbacks.length})
                                </h5>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                  {comunicado.feedbacks.map((fd) => (
                                    <div 
                                      key={fd.id}
                                      className={cn(
                                        "p-2.5 rounded-xl border space-y-1 text-[11px] transition-all",
                                        isDark ? "bg-zinc-950/40 border-zinc-850" : "bg-white border-zinc-150"
                                      )}
                                    >
                                      <div className="flex justify-between items-center select-none">
                                        <span className={cn("font-bold text-xs", isDark ? "text-zinc-200" : "text-zinc-800")}>
                                          {fd.userName}
                                        </span>
                                        {/* Visual star stars */}
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              size={10} 
                                              className={cn(
                                                star <= fd.rating 
                                                  ? "fill-amber-400 text-amber-405" 
                                                  : (isDark ? "text-zinc-800" : "text-zinc-200")
                                              )} 
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      {fd.comment && (
                                        <p className={cn("leading-normal", isDark ? "text-zinc-400" : "text-zinc-650")}>
                                          {fd.comment}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation Bar (WhatsApp style design - perfectly ergonomic) */}
      {!(activeTab === 'chats' && selectedRoom) && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex items-center justify-around px-2 shadow-lg animate-fade-in",
          isDark ? "bg-zinc-950/95 border-zinc-900/80 backdrop-blur-md" : "bg-white/95 border-zinc-200/80 backdrop-blur-md"
        )}>
          {(() => {
            const tabs = [
              { id: 'chats', label: 'Atendimento', icon: MessageSquare, badge: rooms.filter(r => r.status === 'waiting').length }
            ];
            
            // Only admins and supervisors see BI (analytics)
            if (currentRole === 'admin' || currentRole === 'supervisor') {
              tabs.push({ id: 'analytics', label: 'BI', icon: BarChart3, badge: 0 });
            }
            
            tabs.push({ id: 'communication', label: 'Central de Comunicação', icon: Megaphone, badge: 0 });
            tabs.push({ id: 'config', label: 'Configuração', icon: Sliders, badge: 0 });
            
            return tabs;
          })().map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedRoom(null);
                  setIsMobileMenuOpen(false);
                }}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center font-extrabold cursor-pointer transition-all relative select-none"
              >
                <div className="relative">
                  {/* Active Backdrop pill highlighter */}
                  <span className={cn(
                    "absolute -inset-x-4 -inset-y-1 rounded-full -z-10 transition-all duration-300 scale-95 opacity-0",
                    isActive && "scale-100 opacity-100",
                    isActive ? (isDark ? "bg-emerald-600/15" : "bg-emerald-600/10") : ""
                  )} />
                  
                  <IconComponent 
                    size={20} 
                    className={cn(
                      "transition-all",
                      isActive 
                        ? "text-emerald-500 scale-105" 
                        : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-850")
                    )} 
                  />

                  {/* Queue Alert count badge */}
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full min-w-[14px] flex items-center justify-center animate-pulse scale-90 shadow-md">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs mt-1 transition-all select-none truncate max-w-full",
                  isActive 
                    ? "text-emerald-500 font-extrabold" 
                    : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-550 hover:text-zinc-805")
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Transfer modal */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferModal(false)}
              className="absolute inset-0 bg-black/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl border font-sans",
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
              )}
            >
              <div className="flex items-center justify-between border-b pb-3 border-zinc-850/40 mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <ArrowLeftRight size={14} /> Transferir Atendimento
                </h3>
                <button 
                  onClick={() => setShowTransferModal(false)}
                  className="p-1 rounded-md hover:bg-zinc-850/50 text-zinc-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Selecione o operador humano online para quem deseja transferir o chat de <strong>{rooms.find(r => r.room === selectedRoom)?.userName || 'Usuário'}</strong>.
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[
                  { name: 'Lucas Silva', status: 'Online', color: 'bg-emerald-500' },
                  { name: 'Beatriz Costa', status: 'Online', color: 'bg-emerald-500' },
                  { name: 'Rodrigo Lima', status: 'Em Pausa', color: 'bg-rose-500' },
                  { name: 'Clara Meireles', status: 'Online', color: 'bg-emerald-500' }
                ].map((att) => (
                  <button
                    key={att.name}
                    type="button"
                    onClick={() => setSelectedTransferAttendant(att.name)}
                    className={cn(
                      "w-full p-3 rounded-xl flex items-center justify-between text-xs transition-all border text-left cursor-pointer",
                      selectedTransferAttendant === att.name
                        ? (isDark ? "bg-emerald-600/25 border-emerald-500 text-emerald-400 font-extrabold" : "bg-emerald-600/10 border-emerald-600 text-emerald-800 font-extrabold")
                        : (isDark ? "bg-zinc-950/40 border-zinc-850 text-zinc-300 hover:bg-zinc-850 animate-fade-in" : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100")
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full", att.color)} />
                      <span>{att.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {att.status}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-bold transition-all text-xs text-center cursor-pointer",
                    isDark ? "bg-zinc-800 hover:bg-zinc-750 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  )}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedTransferAttendant}
                  onClick={() => {
                    if (!selectedRoom || !selectedTransferAttendant) return;
                    setTransferredRooms(prev => [...prev, selectedRoom]);
                    setShowTransferModal(false);
                    setSelectedRoom(null);
                    setSelectedTransferAttendant('');
                  }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-extrabold transition-all text-xs text-center flex items-center justify-center gap-1 cursor-pointer shadow-md",
                    selectedTransferAttendant
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/15"
                      : "bg-zinc-700 text-zinc-500 border-transparent cursor-not-allowed shadow-none"
                  )}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Closure reason modal */}
      <AnimatePresence>
        {showClosureModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClosureModal(false)}
              className="absolute inset-0 bg-black/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl border font-sans",
                isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
              )}
            >
              <div className="flex items-center justify-between border-b pb-3 border-zinc-800/40 mb-4">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-455 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-rose-405 shrink-0" /> Motivo do Encerramento
                </h3>
                <button 
                  onClick={() => setShowClosureModal(false)}
                  className="p-1 rounded-md hover:bg-zinc-850/50 text-zinc-400 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Selecione obrigatoriamente um motivo de encerramento para tabular e finalizar o chat de <strong>{rooms.find(r => r.room === selectedRoom)?.userName || 'Usuário'}</strong>.
              </p>

              <div className="space-y-2">
                {[
                  'Dúvida de Saldo',
                  'Contestação de Gasto',
                  'Problema no Aplicativo',
                  'Dúvida sobre Metas',
                  'Outros'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedClosureReason(reason)}
                    className={cn(
                      "w-full p-3 rounded-xl flex items-center justify-between text-xs transition-all border text-left cursor-pointer",
                      selectedClosureReason === reason
                        ? (isDark ? "bg-emerald-600/25 border-emerald-500 text-emerald-400 font-extrabold" : "bg-emerald-600/10 border-emerald-600 text-emerald-800 font-extrabold")
                        : (isDark ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-300 hover:bg-zinc-850" : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100")
                    )}
                  >
                    <span>{reason}</span>
                    <span className={cn(
                      "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0",
                      selectedClosureReason === reason ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-705"
                    )}>
                      {selectedClosureReason === reason && <Check size={10} />}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-bold transition-all text-xs text-center cursor-pointer",
                    isDark ? "bg-zinc-800 hover:bg-zinc-750 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  )}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!selectedClosureReason}
                  onClick={() => {
                    if (!selectedClosureReason) return;
                    setClosureCounts(prev => ({
                      ...prev,
                      [selectedClosureReason]: (prev[selectedClosureReason] || 0) + 1
                    }));

                    handleEndService();
                    setShowClosureModal(false);
                  }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl font-extrabold transition-all text-xs text-center flex items-center justify-center gap-1 cursor-pointer shadow-md",
                    selectedClosureReason
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/15"
                      : "bg-zinc-700 text-zinc-550 border-transparent cursor-not-allowed shadow-none"
                  )}
                >
                  Encerrar Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
