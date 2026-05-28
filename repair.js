const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'web/src/app/messages/page.tsx');
let content = fs.readFileSync(p, 'utf8');

content = content.replace(/const props = \{[\s\S]*?handleSendMeetingPoint\s*\};\s*return \(\) => \{/g, 'return () => {');

const authLoadingIdx = content.indexOf('if (authLoading) {');
if (authLoadingIdx > 0) {
  content = content.substring(0, authLoadingIdx);
}

const jsx = `if (authLoading) {
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
        <div className={\`w-full md:w-[320px] lg:w-[380px] flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200/60 dark:border-zinc-800/50 shrink-0 \${activeConvId ? 'hidden md:flex' : 'flex'}\`}>
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
                  className={\`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors \${activeConvId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}\`}
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
        <div className={\`flex-1 flex-col bg-zinc-50 dark:bg-zinc-950/50 \${activeConvId ? 'flex' : 'hidden md:flex'}\`}>
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
                      <div key={msg.id} className={\`flex \${isMe ? 'justify-end' : 'justify-start'}\`}>
                        <div className={\`max-w-[70%] rounded-2xl px-4 py-2 \${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-none shadow-sm'}\`}>
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
                          <div className={\`text-[10px] mt-1 text-right \${isMe ? 'text-blue-200' : 'text-zinc-400'}\`}>
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
`

fs.writeFileSync(p, content + jsx, 'utf8');
