'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { 
  Send, 
  MessageSquare, 
  Star, 
  User, 
  Loader2, 
  Sparkles, 
  MapPin, 
  AlertCircle,
  Clock,
  ArrowLeft,
  ThumbsUp,
  Camera,
  Mic,
  Trash2
} from 'lucide-react';

import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import { useAuthGuard } from '@/lib/hooks/useAuthGuard';
import { UserRole } from '@shared';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@/lib/alerts';

interface PopulatedConversation {
  id: string;
  productId: string | null;
  lastMessageAt: string;
  createdAt: string;
  otherUser: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    sellerId: string;
    status: string;
  } | null;
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    type?: string;
    createdAt: string;
  } | null;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type?: string;
  metadata?: MeetingPointData;
  createdAt: string;
}

interface MeetingPointData {
  id: string;
  name: string;
  campusName: string;
  universityName: string;
  address?: string;
  isSafeZone: boolean;
  [key: string]: unknown;
}

function MessagesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdminPath = pathname.startsWith('/admin');
  const { currentUser, loading: authLoading } = useAuthGuard(isAdminPath ? UserRole.ADMIN : undefined);
  
  // States
  const [conversations, setConversations] = useState<PopulatedConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  
  // Meeting Point states
  const [showMeetingPointModal, setShowMeetingPointModal] = useState(false);
  const [meetingPoints, setMeetingPoints] = useState<MeetingPointData[]>([]);
  const [loadingMeetingPoints, setLoadingMeetingPoints] = useState(false);
  
  // Loading states
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Feedback toast
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sync active conversation from URL query parameter
  const queryConvId = searchParams.get('conversationId');
  const queryProductId = searchParams.get('productId');
  const querySellerId = searchParams.get('sellerId');

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  };

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Khi có productId + sellerId từ URL (click "Nhắn tin trao đổi ngay" từ trang sản phẩm)
  // → tự động tạo hoặc tìm conversation với người bán rồi mở lên
  useEffect(() => {
    if (!currentUser || !queryProductId || !querySellerId) return;

    const openOrCreateConversation = async () => {
      try {
        // Tìm conversation đã có với cùng productId + sellerId
        const existing = conversations.find(
          (c) => c.productId === queryProductId && c.otherUser?.id === querySellerId
        );

        if (existing) {
          setActiveConvId(existing.id);
          // Xoá params khỏi URL cho gọn
          router.replace('/messages?conversationId=' + existing.id);
          return;
        }

        // Chưa có → tạo mới
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: queryProductId, sellerId: querySellerId }),
        });

        if (res.ok) {
          const data = await res.json();
          const newConvId = data.conversationId;
          // Refresh danh sách để populate đầy đủ otherUser + product
          await fetchConversations();
          setActiveConvId(newConvId);
          router.replace('/messages?conversationId=' + newConvId);
        } else {
          showFeedback('Không thể tạo cuộc trò chuyện với người bán!', 'error');
        }
      } catch (err) {
        console.error('Error opening conversation:', err);
        showFeedback('Lỗi kết nối khi mở tin nhắn!', 'error');
      }
    };

    openOrCreateConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, queryProductId, querySellerId]);

  // Set active conversation from URL
  useEffect(() => {
    if (queryConvId && conversations.some(c => c.id === queryConvId)) {
      setActiveConvId(queryConvId);
    } else if (conversations.length > 0 && !activeConvId && !queryProductId) {
      setActiveConvId(conversations[0].id);
    }
  }, [queryConvId, conversations]);

  // Load message draft from Local Storage when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      const savedDraft = localStorage.getItem(`draft_${activeConvId}`);
      if (savedDraft) {
        setNewMessageText(savedDraft);
      } else {
        setNewMessageText('');
      }
    }
  }, [activeConvId]);

  // Fetch messages & connect SSE when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    fetchMessages(activeConvId);

    // Setup SSE connection for real-time messages
    const eventSource = new EventSource(`/api/conversations/${activeConvId}/sse`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          setMessages((prev) => {
            // Avoid duplicate messages
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          // Update conversation list to bump it to top
          fetchConversations(true);
        }
      } catch (err) {
        console.error('Error parsing SSE message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error', err);
      // It will auto-reconnect, but we can close and rely on browser or let it handle it
    };

    
  return () => {
      eventSource.close();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [activeConvId]);

  // Auto scroll to bottom when messages load/update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send text message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConvId || sendingMsg) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    if (activeConvId) {
      localStorage.removeItem(`draft_${activeConvId}`);
    }
    setSendingMsg(true);

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textToSend, type: 'TEXT' }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConvId ? { ...c, lastMessage: data.message, lastMessageAt: new Date().toISOString() } : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      } else {
        showFeedback('Không gửi được tin nhắn!', 'error');
        setNewMessageText(textToSend);
      }
    } catch (err) {
      showFeedback('Lỗi kết nối mạng!', 'error');
      setNewMessageText(textToSend);
    } finally {
      setSendingMsg(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          return; // Too short or empty
        }

        await uploadAndSendAudio(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting audio recording:', err);
      showFeedback('Không thể truy cập Microphone!', 'error');
    }
  };

  // Stop voice recording and upload
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  // Cancel recording and discard
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        if (mediaRecorderRef.current) {
          const stream = mediaRecorderRef.current.stream;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      showFeedback('Đã hủy ghi âm.', 'error');
    }
  };

  // Upload audio and send message
  const uploadAndSendAudio = async (blob: Blob) => {
    setSendingMsg(true);
    try {
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload audio');
      const uploadData = await uploadRes.json();
      const audioUrl = uploadData.url;

      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: audioUrl, type: 'AUDIO' }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, lastMessage: data.message, lastMessageAt: new Date().toISOString() } : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      } else {
        showFeedback('Không thể gửi tin nhắn ghi âm!', 'error');
      }
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
      showFeedback('Không thể gửi tin nhắn!', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  // Fetch meeting points when modal opens
  const openMeetingPointModal = async () => {
    setShowMeetingPointModal(true);
    if (meetingPoints.length === 0) {
      setLoadingMeetingPoints(true);
      try {
        const res = await fetch('/api/meeting-points');
        if (res.ok) {
          const data = await res.json();
          setMeetingPoints(data.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải điểm hẹn:', err);
      } finally {
        setLoadingMeetingPoints(false);
      }
    }
  };

  const handleSendMeetingPoint = async (point: MeetingPointData) => {
    if (!activeConvId || sendingMsg) return;
    setSendingMsg(true);
    setShowMeetingPointModal(false);

    try {
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: `Đề xuất điểm hẹn: ${point.name}`, 
          type: 'MEETING_POINT',
          metadata: point
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConvId ? { ...c, lastMessage: data.message, lastMessageAt: new Date().toISOString() } : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
        scrollToBottom();
      }
    } catch (err) {
      console.error('Lỗi khi gửi điểm hẹn:', err);
      showFeedback('Không thể gửi điểm hẹn!', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  // Handle Image Upload and send
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    setSendingMsg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload image');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: imageUrl, type: 'IMAGE' }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId ? { ...c, lastMessage: data.message, lastMessageAt: new Date().toISOString() } : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      } else {
        showFeedback('Không gửi được ảnh!', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Lỗi tải ảnh lên!', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeConv = conversations.find(c => c.id === activeConvId);

  if (authLoading) {
    return (
      <DashboardLayout activeItemId="messages" pageTitle="Tin Nhắn Chat">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeItemId="messages" pageTitle="Tin Nhắn Chat">
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] md:h-[calc(100vh-100px)] -mx-4 md:mx-0 md:rounded-3xl border-y md:border border-zinc-200/60 dark:border-zinc-800/50 overflow-hidden shadow-sm">
        
        {/* LEFT SIDEBAR: List of conversations */}
        <div className={`w-full md:w-[320px] lg:w-[380px] flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200/60 dark:border-zinc-800/50 shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Đoạn chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-zinc-500">Không có cuộc trò chuyện nào.</div>
            ) : (
              conversations.map(conv => (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${activeConvId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={conv.otherUser?.avatarUrl || '/placeholder.png'} 
                      alt="avatar" 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{conv.otherUser?.fullName || 'Người dùng'}</h3>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </span>
                    </div>
                    {conv.product && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate mb-1">
                        Sản phẩm: {conv.product.name}
                      </div>
                    )}
                    <p className="text-xs text-zinc-500 truncate">
                      {conv.lastMessage?.type === 'IMAGE' ? 'Đã gửi hình ảnh' :
                       conv.lastMessage?.type === 'AUDIO' ? 'Đã gửi tin nhắn thoại' :
                       conv.lastMessage?.type === 'MEETING_POINT' ? 'Đã đề xuất điểm hẹn' :
                       conv.lastMessage?.content || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MIDDLE: Active Chat Window */}
        <div className={`flex-1 flex-col bg-zinc-50 dark:bg-zinc-950/50 ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
          {activeConvId && activeConv ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveConvId(null)} className="md:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img src={activeConv.otherUser?.avatarUrl || '/placeholder.png'} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{activeConv.otherUser?.fullName || 'Người dùng'}</h3>
                  </div>
                </div>
              </div>

              {/* Messages Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMsgs ? (
                  <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none shadow-sm'}`}>
                          {msg.type === 'IMAGE' ? (
                            <img src={msg.content} className="max-w-full rounded-lg mt-1" alt="image" />
                          ) : msg.type === 'AUDIO' ? (
                            <audio src={msg.content} controls className="max-w-[200px] h-10 mt-1" />
                          ) : msg.type === 'MEETING_POINT' ? (
                            <div className="bg-white/10 p-3 rounded-lg border border-white/20 mt-1">
                              <div className="flex items-center gap-2 mb-2 font-bold"><MapPin className="w-4 h-4"/> Điểm hẹn</div>
                              <div>{msg.content}</div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          )}
                          <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-zinc-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send Message Form */}
              <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button type="button" onClick={openMeetingPointModal} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <MapPin className="w-5 h-5" />
                  </button>
                  <label className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={sendingMsg} />
                  </label>
                  
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMsg || isRecording}
                  />

                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 text-sm font-medium animate-pulse">{formatDuration(recordingDuration)}</span>
                      <button type="button" onClick={stopRecording} className="p-2 bg-blue-600 text-white rounded-full">
                        <Send className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={cancelRecording} className="p-2 bg-red-600 text-white rounded-full">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={startRecording} className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                  
                  {!isRecording && (
                    <button type="submit" disabled={!newMessageText.trim() || sendingMsg} className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
              <h4 className="text-zinc-900 dark:text-zinc-100 font-bold mb-1">Cửa sổ trò chuyện</h4>
              <p className="text-xs text-zinc-500 max-w-sm">Chọn một cuộc hội thoại từ danh sách bên trái hoặc nhắn tin từ bài đăng để bắt đầu trao đổi chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      {/* Meeting Point Modal */}
      {showMeetingPointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Đề xuất điểm hẹn giao dịch
              </h3>
              <button 
                onClick={() => setShowMeetingPointModal(false)}
                className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMeetingPoints ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-zinc-500">Đang tải danh sách điểm hẹn...</p>
                </div>
              ) : meetingPoints.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  Chưa có điểm hẹn giao dịch nào trên hệ thống.
                </div>
              ) : (
                meetingPoints.map(point => (
                  <button
                    key={point.id}
                    onClick={() => handleSendMeetingPoint(point)}
                    className="w-full text-left p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-md transition-all flex gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{point.name}</h4>
                      <p className="text-xs text-zinc-500 font-medium mb-1">
                        {point.campusName} - {point.universityName}
                      </p>
                      {point.isSafeZone && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Khu vực an toàn
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
