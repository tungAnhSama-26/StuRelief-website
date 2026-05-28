Created At: 2026-05-28T07:57:30Z
Completed At: 2026-05-28T07:57:30Z
File Path: `file:///C:/Users/tunga/OneDrive/Desktop/github_project/StuRelief/web/src/app/messages/page.tsx`
Total Lines: 620
Total Bytes: 20800
Showing lines 500 to 620
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
500:       formData.append('file', file);
501: 
502:       const uploadRes = await fetch('/api/upload', {
503:         method: 'POST',
504:         body: formData,
505:       });
506: 
507:       if (!uploadRes.ok) {
508:         const errData = await uploadRes.json();
509:         throw new Error(errData.error || 'Failed to upload image');
510:       }
511: 
512:       const uploadData = await uploadRes.json();
513:       const imageUrl = uploadData.url;
514: 
515:       const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
516:         method: 'POST',
517:         headers: { 'Content-Type': 'application/json' },
518:         body: JSON.stringify({ content: imageUrl, type: 'IMAGE' }),
519:       });
520: 
521:       if (res.ok) {
522:         const data = await res.json();
523:         setMessages((prev) => [...prev, data.message]);
524:         setConversations((prev) =>
525:           prev.map((c) =>
526:             c.id === activeConvId ? { ...c, lastMessage: data.message, lastMessageAt: new Date().toISOString() } : c
527:           ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
528:         );
529:       } else {
530:         showFeedback('Không gửi được ảnh!', 'error');
531:       }
532:     } catch (err: any) {
533:       showFeedback(err.message || 'Lỗi tải ảnh lên!', 'error');
534:     } finally {
535:       setSendingMsg(false);
536:     }
537:   };
538: 
539:   const formatDuration = (seconds: number) => {
540:     const mins = Math.floor(seconds / 60);
541:     const secs = seconds % 60;
542:     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
543:   };
544: 
545:   const activeConv = conversations.find(c => c.id === activeConvId);
546: 
547:   if (authLoading) {
548:     return (
549:       <DashboardLayout activeItemId="messages" pageTitle="Tin Nhắn Chat">
550:         <div className="flex items-center justify-center min-h-[60vh]">
551:           <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
552:         </div>
553:       <MeetingPointModal {...props} />
554:       {/* Meeting Point Modal */}
555:       {showMeetingPointModal && (
556:         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
557:           <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
558:             <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10">
559:               <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
560:                 <MapPin className="w-5 h-5 text-blue-600" />
561:                 Đề xuất điểm hẹn giao dịch
562:               </h3>
563:               <button 
564:                 onClick={() => setShowMeetingPointModal(false)}
565:                 className="p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl"
566:               >
567:                 ✕
568:               </button>
569:             </div>
570:             
571:             <div className="flex-1 overflow-y-auto p-4 space-y-3">
572:               {loadingMeetingPoints ? (
573:                 <div className="flex flex-col items-center justify-center py-10">
574:                   <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
575:                   <p className="text-sm text-zinc-500">Đang tải danh sách điểm hẹn...</p>
576:                 </div>
577:               ) : meetingPoints.length === 0 ? (
578:                 <div className="text-center py-10 text-zinc-500">
579:                   Chưa có điểm hẹn giao dịch nào trên hệ thống.
580:                 </div>
581:               ) : (
582:                 meetingPoints.map(point => (
583:                   <button
584:                     key={point.id}
585:                     onClick={() => handleSendMeetingPoint(point)}
586:                     className="w-full text-left p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:shadow-md transition-all flex gap-3 group"
587:                   >
588:                     <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
589:                       <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
590:                     </div>
591:                     <div>
592:                       <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">{point.name}</h4>
593:                       <p className="text-xs text-zinc-500 font-medium mb-1">
594:                         {point.campusName} - {point.universityName}
595:                       </p>
596:                       {point.isSafeZone && (
597:                         <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
598:                           Khu vực an toàn
599:                         </span>
600:                       )}
601:                     </div>
602:                   </button>
603:                 ))
604:               )}
605:             </div>
606:           </div>
607:         </div>
608:       )}
609:     </DashboardLayout>
610:   );
611: }
612: 
613: export default function MessagesPage() {
614:   return (
615:     <Suspense fallback={<div className="flex h-screen items-center justify-center">Đang tải...</div>}>
616:       <MessagesContent />
617:     </Suspense>
618:   );
619: }
620: 
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
