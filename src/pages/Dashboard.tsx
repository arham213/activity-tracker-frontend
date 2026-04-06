import { useEffect, useRef, useState } from "react";

interface TrackLog {
    image: string;
    activity: string;
    loggedAt: Date;
}

export default function Dashboard() {
    const [trackLogs, setTrackLogs] = useState<TrackLog[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isTracking, setIsTracking] = useState<Boolean>(false);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(10);
    const [status, setStatus] = useState<"idle" | "tracking" | "capturing" | "captioning">("idle");
    const [flashCapture, setFlashCapture] = useState(false);
    const videoElementRef = useRef<HTMLVideoElement>(null);
    const canvasElementRef = useRef<HTMLCanvasElement>(null);
    const cdRef = useRef(10);

    useEffect(() => {
        if (videoElementRef.current) {
            videoElementRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (!isTracking) return;

        cdRef.current = 10;
        setCountdown(10);

        const cdInterval = setInterval(() => {
            cdRef.current = cdRef.current <= 1 ? 10 : cdRef.current - 1;
            setCountdown(cdRef.current);
        }, 1000);

        const interval = setInterval(async () => {
            setStatus("capturing");
            setFlashCapture(true);
            setTimeout(() => setFlashCapture(false), 300);

            const snapshot = await takeSnapshot();
            if (!snapshot) return;
            const snapshotTime = new Date();

            setStatus("captioning");
            const activity = await processSnapshot(snapshot);

            setTrackLogs((prev) => [
                { image: URL.createObjectURL(snapshot), activity, loggedAt: snapshotTime },
                ...prev,
            ]);
            setStatus("tracking");
            cdRef.current = 10;
            setCountdown(10);
        }, 10000);

        return () => {
            clearInterval(interval);
            clearInterval(cdInterval);
        };
    }, [isTracking]);

    const handleTracking = async () => {
        if (!isTracking) {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setStatus("tracking");
        } else {
            stream?.getTracks().forEach((t) => t.stop());
            setStream(null);
            setStatus("idle");
        }
        setIsTracking(!isTracking);
    };

    const takeSnapshot = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const video = videoElementRef.current;
            const canvas = canvasElementRef.current;
            if (!video || !canvas) return resolve(null);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d")?.drawImage(video, 0, 0);
            canvas.toBlob((blob) => resolve(blob), "image/jpeg");
        });
    };

    const processSnapshot = async (snapshot: Blob) => {
        try {
            const formData = new FormData();
            formData.append("file", snapshot, "snapshot.jpg");
            const response = await fetch("http://localhost:8000/image-to-text/with-file/", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            return result.caption;
        } catch (error) {
            console.error(error);
            return "Could not analyze activity.";
        }
    };

    const INTERVAL = 10;
    const progress = ((INTERVAL - countdown) / INTERVAL) * 100;
    const circumference = 2 * Math.PI * 28;
    const strokeDash = circumference - (progress / 100) * circumference;

    const statusColors: Record<string, string> = {
        idle: "#4b5563",
        tracking: "#34d399",
        capturing: "#fbbf24",
        captioning: "#a78bfa",
    };
    const statusLabels: Record<string, string> = {
        idle: "Ready",
        tracking: "Watching",
        capturing: "Capturing",
        captioning: "Analyzing",
    };

    function formatTime(d: Date) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    return (
        <div style={{ minHeight: "100vh", background: "#060912", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden", position: "relative" }}>
            {/* Ambient blobs */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)" }} />
                <div style={{ position: "absolute", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)" }} />
            </div>

            <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "32px 20px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 40, padding: "6px 18px", marginBottom: 18 }}>
                        <span style={{ fontSize: 11, letterSpacing: 2, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>AI-Powered</span>
                    </div>
                    <h1 style={{ fontSize: 38, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #f8fafc 0%, #a78bfa 50%, #34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2, letterSpacing: -1 }}>
                        Activity Tracker
                    </h1>
                    <p style={{ fontSize: 14, color: "#4b5563", marginTop: 10, letterSpacing: 0.3 }}>Your AI observer — capturing life, 10 seconds at a time</p>
                </div>

                {/* Main Card */}
                <div style={{ background: "linear-gradient(145deg, rgba(30,33,55,0.95), rgba(15,17,30,0.98))", borderRadius: 28, border: "1px solid rgba(99,102,241,0.15)", padding: 28, marginBottom: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
                        {/* Camera */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                            {isTracking && (
                                <div style={{ position: "absolute", inset: -6, borderRadius: 22, background: `conic-gradient(${statusColors[status as string]}, transparent, ${statusColors[status as string]})`, opacity: 0.4, animation: "spin 3s linear infinite" }} />
                            )}
                            <div style={{ position: "relative", width: 220, height: 165, borderRadius: 18, overflow: "hidden", background: "#080b14", border: `1px solid ${isTracking ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.06)"}`, transition: "border-color 0.4s" }}>
                                <video ref={videoElementRef} autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isTracking ? 1 : 0, transition: "opacity 0.5s" }} />
                                <canvas ref={canvasElementRef} style={{ display: "none" }} />

                                {flashCapture && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", borderRadius: 18 }} />}

                                {!isTracking && (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 10 }}>📷</div>
                                        <span style={{ fontSize: 11, color: "#374151", letterSpacing: 1 }}>CAMERA OFFLINE</span>
                                    </div>
                                )}

                                {isTracking && (
                                    <>
                                        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 10px" }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "pulse 1s infinite" }} />
                                            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>LIVE</span>
                                        </div>
                                        {status === "captioning" && (
                                            <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 10px", fontSize: 10, color: "#a78bfa", textAlign: "center", letterSpacing: 0.5 }}>
                                                ✦ AI Analyzing...
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `rgba(${status === "tracking" ? "52,211,153" : status === "captioning" ? "167,139,250" : status === "capturing" ? "251,191,36" : "75,85,99"},0.1)`, border: `1px solid ${statusColors[status as string]}30`, borderRadius: 30, padding: "5px 14px", marginBottom: 20 }}>
                                <span style={{ fontSize: 8, color: statusColors[status as string], animation: isTracking ? "pulse 1.5s infinite" : "none" }}>⬤</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: statusColors[status as string], letterSpacing: 0.5 }}>{statusLabels[status as string]}</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                                {isTracking && (
                                    <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
                                        <svg width="66" height="66" style={{ transform: "rotate(-90deg)" }}>
                                            <circle cx="33" cy="33" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                            <circle cx="33" cy="33" r="28" fill="none" stroke={statusColors[status as string]} strokeWidth="3"
                                                strokeDasharray={circumference} strokeDashoffset={strokeDash}
                                                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.4s" }} />
                                        </svg>
                                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{countdown}</span>
                                            <span style={{ fontSize: 8, color: "#4b5563", letterSpacing: 0.5 }}>SEC</span>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={handleTracking}
                                    style={{ flex: 1, padding: "14px 20px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, letterSpacing: 0.3, background: isTracking ? "linear-gradient(135deg, #7f1d1d, #991b1b)" : "linear-gradient(135deg, #6366f1, #8b5cf6, #7c3aed)", color: "#fff", boxShadow: isTracking ? "0 0 30px rgba(239,68,68,0.2)" : "0 0 40px rgba(99,102,241,0.35), 0 4px 20px rgba(139,92,246,0.3)", transition: "all 0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                                >
                                    {isTracking ? "⏹  Stop Tracking" : "▶  Start Tracking"}
                                </button>
                            </div>

                            <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
                                {isTracking ? `📸 Next capture in ${countdown}s · ${trackLogs.length} logged` : "Click start to begin monitoring your activity"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats bar */}
                {trackLogs.length > 0 && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "Captured", value: trackLogs.length, icon: "📸" },
                            { label: "Latest", value: formatTime(trackLogs[0].loggedAt), icon: "🕐" },
                            { label: "Session", value: isTracking ? "Active" : "Paused", icon: isTracking ? "🟢" : "⏸" },
                        ].map((s, i) => (
                            <div key={i} style={{ flex: 1, background: "rgba(30,33,55,0.7)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 16px" }}>
                                <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: "#374151", marginTop: 2, letterSpacing: 0.5 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Log */}
                <div style={{ background: "linear-gradient(145deg, rgba(30,33,55,0.9), rgba(15,17,30,0.95))", borderRadius: 24, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📋</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Activity Log</div>
                                <div style={{ fontSize: 11, color: "#374151" }}>{trackLogs.length} {trackLogs.length === 1 ? "entry" : "entries"} recorded</div>
                            </div>
                        </div>
                        {trackLogs.length > 0 && (
                            <button onClick={() => setTrackLogs([])} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, color: "#f87171", fontSize: 11, fontWeight: 600, padding: "5px 12px", cursor: "pointer", letterSpacing: 0.3 }}>
                                Clear All
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: 440, overflowY: "auto", padding: trackLogs.length ? "8px 0" : 0 }}>
                        {trackLogs.length === 0 ? (
                            <div style={{ padding: "60px 20px", textAlign: "center" }}>
                                <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👁</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nothing logged yet</div>
                                <div style={{ fontSize: 12, color: "#1f2937" }}>Start tracking to capture your first activity</div>
                            </div>
                        ) : (
                            trackLogs.map((log, i) => (
                                <div
                                    key={i}
                                    onClick={() => setExpandedLog(expandedLog === i ? null : i)}
                                    style={{ display: "flex", gap: 16, padding: "14px 22px", cursor: "pointer", borderBottom: i < trackLogs.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", background: expandedLog === i ? "rgba(99,102,241,0.05)" : "transparent", transition: "background 0.2s", animation: i === 0 ? "slideIn 0.4s ease-out" : "none" }}
                                    onMouseEnter={(e) => { if (expandedLog !== i) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                    onMouseLeave={(e) => { if (expandedLog !== i) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <img src={log.image} alt="capture" style={{ width: expandedLog === i ? 110 : 76, height: expandedLog === i ? 82 : 57, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", transition: "all 0.3s" }} />
                                        {i === 0 && (
                                            <div style={{ position: "absolute", top: -4, right: -4, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 4, padding: "1px 5px", fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: 0.5 }}>NEW</div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: 10, color: "#4b5563", fontWeight: 600, letterSpacing: 0.5 }}>{formatTime(log.loggedAt)}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#1f2937", display: "inline-block" }} />
                                            <span style={{ fontSize: 10, color: "#1f2937" }}>#{trackLogs.length - i}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, display: expandedLog === i ? "block" : "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                                            {log.activity}
                                        </div>
                                        {expandedLog !== i && log.activity?.length > 100 && (
                                            <div style={{ fontSize: 10, color: "#4b5563", marginTop: 4 }}>Click to expand ↓</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 4px; }
            `}</style>
        </div>
    );
}