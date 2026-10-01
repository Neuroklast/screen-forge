import { useEffect, useRef, useState } from "react";
import { useTraining, type Signal } from "../core/useExercise";
import { t } from "../i18n";
// Supply private STUN/TURN credentials through deployment configuration when crossing NAT.
function iceServers(): RTCIceServer[] {
  try {
    return JSON.parse(import.meta.env.VITE_RTC_ICE_SERVERS || "[]");
  } catch {
    return [];
  }
}
export function CameraFeed({
  station,
  publish = false,
}: {
  station: string;
  publish?: boolean;
}) {
  const ex = useTraining(),
    video = useRef<HTMLVideoElement>(null),
    [stream, setStream] = useState<MediaStream | null>(null),
    [status, setStatus] = useState("Ready"),
    [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [device, setDevice] = useState("");
  const pending = useRef(false),
    mounted = useRef(true),
    current = useRef<MediaStream | null>(null);
  const offline = !!ex.state.cameraOffline[station];
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
  const stop = () => {
    current.current?.getTracks().forEach((t) => t.stop());
    current.current = null;
    setStream(null);
    setStatus(t("camera.stopped"));
  };
  const start = async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      if (!isSecureContext || !navigator.mediaDevices)
        throw new Error("Webcam requires HTTPS and camera permission.");
      const next = await navigator.mediaDevices.getUserMedia({
        video: device ? { deviceId: { exact: device } } : true,
        audio: false,
      });
      if (!mounted.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      current.current?.getTracks().forEach((t) => t.stop());
      current.current = next;
      setStream(next);
      setStatus(t("camera.active"));
      setDevices(
        (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput",
        ),
      );
    } catch (e) {
      if (mounted.current) setStatus((e as Error).message);
    } finally {
      pending.current = false;
    }
  };
  useEffect(() => {
    if (publish && video.current) video.current.srcObject = stream;
  }, [stream, publish]);
  useEffect(() => {
    if (offline || !ex.online || (publish && !stream)) {
      if (!publish && video.current) video.current.srcObject = null;
      return;
    }
    let disposed = false;
    const peers = new Map<string, RTCPeerConnection>(),
      candidates = new Map<string, RTCIceCandidateInit[]>();
    const close = (id: string) => {
      peers.get(id)?.close();
      peers.delete(id);
      candidates.delete(id);
    };
    const create = (id: string) => {
      close(id);
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      peers.set(id, pc);
      pc.onicecandidate = (e) => {
        if (e.candidate)
          ex.send({
            type: "signal",
            to: id,
            data: { type: "ice", candidate: e.candidate.toJSON() },
          });
      };
      pc.ontrack = (e) => {
        if (!disposed && video.current) {
          video.current.srcObject = e.streams[0] || new MediaStream([e.track]);
          setStatus("LIVE");
        }
      };
      pc.onconnectionstatechange = () => {
        if (!disposed)
          setStatus(
            pc.connectionState === "connected" ? "LIVE" : pc.connectionState,
          );
      };
      if (publish)
        stream?.getTracks().forEach((track) => pc.addTrack(track, stream));
      return pc;
    };
    const handle = async (msg: Signal) => {
      if (!publish && msg.from !== station) return;
      const { from, data } = msg;
      if (data.type === "request" && publish) {
        const pc = create(from);
        await pc.setLocalDescription(await pc.createOffer());
        if (!disposed)
          ex.send({
            type: "signal",
            to: from,
            data: { type: "offer", sdp: pc.localDescription },
          });
      } else if (data.type === "offer" && !publish && data.sdp) {
        const pc = create(from);
        await pc.setRemoteDescription(data.sdp);
        await pc.setLocalDescription(await pc.createAnswer());
        if (!disposed)
          ex.send({
            type: "signal",
            to: from,
            data: { type: "answer", sdp: pc.localDescription },
          });
      } else if (data.type === "answer" && publish && data.sdp) {
        await peers.get(from)?.setRemoteDescription(data.sdp);
      } else if (data.type === "ice" && data.candidate) {
        const pc = peers.get(from);
        if (pc?.remoteDescription) await pc.addIceCandidate(data.candidate);
        else
          candidates.set(
            from,
            [...(candidates.get(from) || []), data.candidate].slice(-100),
          );
      } else if (data.type === "stop") {
        close(from);
        if (video.current && !publish) video.current.srcObject = null;
        setStatus(t("camera.stopped"));
      }
      const pc = peers.get(from);
      if (pc?.remoteDescription) {
        const queued = candidates.get(from) || [];
        candidates.delete(from);
        for (const c of queued) await pc.addIceCandidate(c);
      }
    };
    const unsub = ex.subscribe((msg) => {
      void handle(msg).catch((e) => {
        if (!disposed) setStatus(`Videoverbindung: ${(e as Error).message}`);
      });
    });
    const request = () => {
      const pc = peers.get(station);
      if (
        !publish &&
        (!pc ||
          ["failed", "closed", "disconnected"].includes(pc.connectionState))
      )
        ex.send({ type: "signal", to: station, data: { type: "request" } });
    };
    request();
    const retry = setInterval(request, 5000);
    return () => {
      disposed = true;
      clearInterval(retry);
      unsub();
      for (const [id, pc] of peers) {
        if (publish)
          ex.send({ type: "signal", to: id, data: { type: "stop" } });
        pc.close();
      }
    };
  }, [stream, offline, publish, station, ex.online, ex.send, ex.subscribe]);
  return (
    <section className="camera-feed">
      <div className="camera-screen">
        <video ref={video} autoPlay playsInline muted hidden={offline} />
        {offline && <strong>SIGNAL LOST</strong>}
        <span>
          {station} ·{" "}
          {offline ? t("camera.signalInterrupted") : status}
        </span>
      </div>
      {publish && (
        <div className="button-row">
          <select
            aria-label={t("camera.webcam")}
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          >
              <option value="">{t("camera.default")}</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          <button onClick={() => void start()}>{t("camera.startSwitch")}</button>
          <button onClick={stop}>{t("camera.stop")}</button>
        </div>
      )}
    </section>
  );
}
