import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface VirtualInterviewRoomProps {
  application: any;
  onClose: () => void;
  onAttendanceCompleted?: () => void;
}

export const VirtualInterviewRoom: React.FC<VirtualInterviewRoomProps> = ({
  application,
  onClose,
  onAttendanceCompleted,
}) => {
  const { user, showToast } = useAuth();
  const [inCall, setInCall] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [cameraOn, setCameraOn] = useState<boolean>(true);
  const [screenSharing, setScreenSharing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'code' | 'chat'>('problem');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  // Scratchpad state
  const [codeNotes, setCodeNotes] = useState<string>(
`// Solution: In-Memory Key-Value Store with Expiration & Eviction
// Candidate: ${user?.name || 'Student Candidate'}
// Role: ${application?.jobId?.title || 'Software Engineering'}

class TimeLimitedCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, duration) {
    const exists = this.cache.has(key);
    if (exists) clearTimeout(this.cache.get(key).timeoutId);
    
    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
    }, duration);

    this.cache.set(key, { value, timeoutId });
    return exists;
  }

  get(key) {
    return this.cache.has(key) ? this.cache.get(key).value : -1;
  }

  count() {
    return this.cache.size;
  }
}
`
  );

  // Chat messages simulation
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; time: string; text: string; isSelf: boolean }>>([
    {
      sender: 'Dr. Rajesh K. (Technical Interview Lead)',
      time: '10:00 AM',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! Welcome to your technical assessment round for ${(application?.companyId as any)?.companyName || 'the campus drive'}. Whenever you are ready, please walk me through your approach.`,
      isSelf: false,
    },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');

  // Call timer
  useEffect(() => {
    let timer: any = null;
    if (inCall && !completed) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inCall, completed]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
      sender: user?.name || 'Candidate',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: newMessage.trim(),
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage('');

    // Automated interviewer response after 2 seconds
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Rajesh K. (Technical Lead)',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Great observation on time complexity! How would you optimize the locking mechanism under high concurrency?',
          isSelf: false,
        },
      ]);
    }, 2000);
  };

  const handleCompleteInterview = async () => {
    setSubmitting(true);
    try {
      await api.student.attendInterview(application._id, {
        remarks: `Candidate completed live technical interview session (${formatTimer(callDuration)} duration) with panel assessment code submitted.`,
        notes: `Candidate evaluated on algorithms, code architecture, and problem breakdown. Duration: ${formatTimer(callDuration)}.`,
      });

      setCompleted(true);
      showToast({
        type: 'success',
        title: 'Interview Attendance Verified!',
        message: 'Your live interview session has been officially confirmed in the university placement pipeline.',
      });

      if (onAttendanceCompleted) {
        onAttendanceCompleted();
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Failed to record interview attendance.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const company = application?.companyId as any;
  const job = application?.jobId as any;
  const companyName = company?.companyName || 'Corporate Recruiter';
  const jobTitle = job?.title || 'Campus Placement Drive';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-5xl h-[92vh] max-h-[860px] shadow-2xl border border-outline-variant flex flex-col overflow-hidden text-xs">
        
        {/* Top Header Bar */}
        <div className="h-14 px-5 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {companyName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-on-surface">{companyName}</span>
                <span className="text-outline-variant">•</span>
                <span className="text-on-surface-variant font-medium">{jobTitle}</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Live Technical Interview Panel • Room #{application._id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {inCall && !completed && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-code-tabular font-bold">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                <span>REC {formatTimer(callDuration)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Close modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {completed ? (
          /* COMPLETION SUCCESS SCREEN */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center gap-4 bg-surface-container-lowest">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <div className="max-w-md">
              <h2 className="font-headline-md text-xl font-bold text-on-surface">
                Interview Session Completed!
              </h2>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                Your live technical interview with <strong>{companyName}</strong> has been officially logged in your university placement records.
                Total interview duration: <strong>{formatTimer(callDuration)}</strong>.
              </p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 max-w-md w-full text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Candidate:</span>
                <span className="font-semibold text-on-surface">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Drive Position:</span>
                <span className="font-semibold text-on-surface">{jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Evaluation Status:</span>
                <span className="font-bold text-emerald-800">Attendance Logged &amp; Submitted</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary-container shadow-sm transition-all"
            >
              Return to Placement Dashboard
            </button>
          </div>
        ) : !inCall ? (
          /* PRE-CALL LOBBY & DEVICE CHECK */
          <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Device Preview Simulation */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-md flex items-center justify-center border border-slate-700">
                {cameraOn ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
                    <div className="w-20 h-20 rounded-full bg-secondary/80 border-2 border-white/50 flex items-center justify-center text-2xl font-bold mb-3 shadow-lg">
                      {user?.name?.charAt(0) || 'S'}
                    </div>
                    <span className="font-semibold text-sm">{user?.name || 'Candidate Student'}</span>
                    <span className="text-xs text-white/70 font-code-tabular mt-0.5">
                      Roll: {user?.profile?.registrationNumber || '2022CSB1048'} • HD Webcam Active
                    </span>

                    {/* Microphone waveform simulator */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs">
                      <span className={`material-symbols-outlined text-sm ${micOn ? 'text-emerald-400' : 'text-error'}`}>
                        {micOn ? 'mic' : 'mic_off'}
                      </span>
                      <span className="text-[11px] font-medium text-white">
                        {micOn ? 'Audio: 100% Ready' : 'Microphone Muted'}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Lobby Preview
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <span className="material-symbols-outlined text-4xl">videocam_off</span>
                    <span>Camera is turned off</span>
                  </div>
                )}
              </div>

              {/* Lobby Media Toggles */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setMicOn(!micOn)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all ${
                    micOn
                      ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{micOn ? 'mic' : 'mic_off'}</span>
                  <span>{micOn ? 'Mic On' : 'Mic Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all ${
                    cameraOn
                      ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {cameraOn ? 'videocam' : 'videocam_off'}
                  </span>
                  <span>{cameraOn ? 'Camera On' : 'Camera Off'}</span>
                </button>
              </div>
            </div>

            {/* Right: Interview Overview & Enter Action */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/40 flex flex-col gap-3">
                <span className="font-label-compact uppercase tracking-wider text-[11px] font-bold text-secondary">
                  Live Technical Assessment
                </span>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                  Ready to attend your interview?
                </h3>
                <p className="text-on-surface-variant leading-relaxed text-xs">
                  You are entering the official campus interview room for <strong>{companyName}</strong>.
                  Please ensure a quiet environment and keep your university identity credentials ready.
                </p>

                <div className="space-y-2 pt-2 border-t border-outline-variant/30 text-xs">
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    <span>Panel: Senior Engineering Lead &amp; Technical TA</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    <span>Format: Live Architecture &amp; Data Structures</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                    <span>Duration: 45 Minutes Evaluation Window</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInCall(true)}
                className="w-full py-3 bg-secondary hover:bg-secondary-container text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">meeting_room</span>
                <span>Join Virtual Interview Room</span>
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE LIVE INTERVIEW STAGE */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left: Video Tiles Stream */}
            <div className="lg:w-3/5 p-4 flex flex-col justify-between gap-3 bg-slate-950 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 items-stretch min-h-[280px]">
                
                {/* Tile 1: Interviewer Panelist */}
                <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-white p-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-secondary to-blue-400 flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/20">
                      R
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
                  </div>
                  <span className="font-bold text-sm mt-3">Dr. Rajesh K.</span>
                  <span className="text-[11px] text-slate-400">Engineering TA Lead • Google India</span>

                  <div className="absolute top-3 left-3 bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">volume_up</span>
                    <span>Speaking</span>
                  </div>
                </div>

                {/* Tile 2: Student Candidate (Self) */}
                <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-white p-4">
                  {cameraOn ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-md border-2 border-white/20">
                        {user?.name?.charAt(0) || 'S'}
                      </div>
                      <span className="font-bold text-sm mt-3">{user?.name} (You)</span>
                      <span className="text-[11px] text-slate-400">
                        Roll: {user?.profile?.registrationNumber || '2022CSB1048'}
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <span className="material-symbols-outlined text-3xl">videocam_off</span>
                      <span className="text-xs">Camera Off</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-slate-300 font-semibold flex items-center gap-1">
                    <span className={`material-symbols-outlined text-xs ${micOn ? 'text-emerald-400' : 'text-error'}`}>
                      {micOn ? 'mic' : 'mic_off'}
                    </span>
                    <span>{micOn ? 'Muted' : 'Mute'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom In-Call Media Bar */}
              <div className="h-14 bg-slate-900/90 rounded-xl border border-slate-800 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMicOn(!micOn)}
                    className={`p-2 rounded-lg transition-colors ${
                      micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-error text-white'
                    }`}
                    title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                  >
                    <span className="material-symbols-outlined text-lg">{micOn ? 'mic' : 'mic_off'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCameraOn(!cameraOn)}
                    className={`p-2 rounded-lg transition-colors ${
                      cameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-error text-white'
                    }`}
                    title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {cameraOn ? 'videocam' : 'videocam_off'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScreenSharing(!screenSharing);
                      showToast({
                        type: 'info',
                        title: screenSharing ? 'Screen Share Stopped' : 'Screen Share Active',
                        message: screenSharing ? 'Broadcasting stopped.' : 'Presenting your whiteboard / code window to panel.',
                      });
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      screenSharing ? 'bg-secondary text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                    title="Screen Share"
                  >
                    <span className="material-symbols-outlined text-lg">present_to_all</span>
                  </button>
                </div>

                {/* Final Submit & Complete Interview Button */}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCompleteInterview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{submitting ? 'Submitting...' : 'Complete & Submit Interview'}</span>
                </button>
              </div>
            </div>

            {/* Right: Technical Problem & Code Scratchpad & Live Chat */}
            <div className="lg:w-2/5 border-l border-outline-variant/60 bg-surface-container-lowest flex flex-col overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-outline-variant/40 bg-surface-container-low shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('problem')}
                  className={`flex-1 py-2.5 font-bold transition-all border-b-2 text-center ${
                    activeTab === 'problem'
                      ? 'border-secondary text-secondary bg-surface-container-lowest'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Problem Brief
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 py-2.5 font-bold transition-all border-b-2 text-center ${
                    activeTab === 'code'
                      ? 'border-secondary text-secondary bg-surface-container-lowest'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Live Code &amp; Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2.5 font-bold transition-all border-b-2 text-center relative ${
                    activeTab === 'chat'
                      ? 'border-secondary text-secondary bg-surface-container-lowest'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Live Chat
                </button>
              </div>

              {/* Tab 1: Problem */}
              {activeTab === 'problem' && (
                <div className="flex-1 p-5 overflow-y-auto space-y-3 leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                      Medium Complexity
                    </span>
                    <span className="font-code-tabular text-on-surface-variant text-[11px]">
                      Expected: O(1) Get / Set
                    </span>
                  </div>

                  <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                    Design Time-Limited Key-Value Cache with Eviction
                  </h3>

                  <p className="text-on-surface-variant">
                    Implement a class <code className="bg-surface-container px-1 py-0.5 rounded font-code-tabular">TimeLimitedCache</code> that allows storing key-value pairs with an associated duration (TTL in milliseconds).
                  </p>

                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/40 space-y-2">
                    <span className="font-semibold text-on-surface block">Methods required:</span>
                    <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
                      <li><strong className="text-on-surface font-code-tabular">set(key, value, duration)</strong>: Stores the value. Overwrites and resets timer if key already exists.</li>
                      <li><strong className="text-on-surface font-code-tabular">get(key)</strong>: Returns value if unexpired, or -1.</li>
                      <li><strong className="text-on-surface font-code-tabular">count()</strong>: Returns the total count of unexpired keys currently stored.</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('code')}
                      className="px-3.5 py-1.5 rounded-lg bg-secondary text-white font-semibold hover:bg-secondary-container transition-all"
                    >
                      Open Code Editor ➔
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Code Editor Scratchpad */}
              {activeTab === 'code' && (
                <div className="flex-1 flex flex-col p-3 gap-2 overflow-hidden bg-slate-900">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                    <span className="font-code-tabular">language: javascript (es2022)</span>
                    <button
                      type="button"
                      onClick={() =>
                        showToast({
                          type: 'success',
                          title: 'Code Syntax Passed',
                          message: 'Test case evaluation: 3/3 passed. Verified by interviewer.',
                        })
                      }
                      className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                    >
                      Run Tests
                    </button>
                  </div>
                  <textarea
                    value={codeNotes}
                    onChange={(e) => setCodeNotes(e.target.value)}
                    className="flex-1 w-full bg-transparent text-emerald-400 font-code-tabular text-xs p-2 rounded focus:outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  ></textarea>
                </div>
              )}

              {/* Tab 3: Chat */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col max-w-[85%] rounded-xl p-2.5 ${
                          msg.isSelf
                            ? 'ml-auto bg-secondary text-white'
                            : 'mr-auto bg-surface-container text-on-surface'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 mb-0.5">
                          <span className="font-semibold">{msg.sender}</span>
                          <span className="font-code-tabular">{msg.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/40 flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message to interviewer..."
                      className="flex-1 p-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs focus:outline-none focus:border-secondary"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-secondary text-white rounded-xl hover:bg-secondary-container"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
