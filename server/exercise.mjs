import http from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { scenarioSchema, patientSchema, actionSchema, newState, advance, act, evaluate, projectState, logEvent } from '../src/core/training.ts';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const equal = (a, b) => timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
const token = () => randomBytes(32).toString('base64url');
const ident = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const position = z.object({ lat: z.number().min(-85).max(85), lng: z.number().min(-180).max(180), accuracy: z.number().min(0).max(10000), timestamp: z.number().finite() });
const hello = z.object({ type: z.literal('hello'), room: ident, role: z.enum(['trainer','hq','element']), station: z.string().max(40), token: z.string().min(1).max(300), invite: z.boolean().optional() });

export async function startExercise({ port = Number(process.env.EXERCISE_PORT || 8787), host = process.env.EXERCISE_HOST || '0.0.0.0', secret = process.env.EXERCISE_ADMIN_KEY || token(), dataDir = process.env.EXERCISE_DATA_DIR || '.exercise-data', dist = resolve('dist') } = {}) {
  const rooms = new Map(), baseline = new Map(), credentials = new Map(), invites = new Map(), sockets = new Map();
  let dirty = false, writing = Promise.resolve();
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  try {
    const saved = JSON.parse(await readFile(resolve(dataDir, 'rooms.json'), 'utf8'));
    for (const [key, value] of saved.rooms ?? []) {
      value.scenario = scenarioSchema.parse(value.scenario); value.frozen = true; value.presence = {};
      rooms.set(key, value);
    }
    for (const [key, value] of saved.baseline ?? []) baseline.set(key, scenarioSchema.parse(value));
    for (const [key, value] of saved.credentials ?? []) if (value.expires > Date.now()) credentials.set(key, value);
  } catch (error) { if (error.code !== 'ENOENT') throw new Error('Cannot load exercise data; refusing to overwrite it', { cause: error }); }
  const persist = () => {
    if (!dirty) return writing;
    dirty = false;
    const json = JSON.stringify({ rooms: [...rooms], baseline: [...baseline], credentials: [...credentials] });
    writing = writing.then(async () => { const path = resolve(dataDir, 'rooms.json'); await writeFile(`${path}.tmp`, json, { mode: 0o600 }); await rename(`${path}.tmp`, path); }).catch(error => { dirty = true; console.error('Exercise save failed:', error.message); });
    return writing;
  };
  const send = (ws, msg) => { if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 16000000) ws.send(JSON.stringify(msg)); };
  const broadcast = room => { const state = rooms.get(room); for (const [ws, meta] of sockets) if (meta.room === room) send(ws, { type: 'state', state: projectState(state, meta.role, meta.station) }); };
  const disconnectStation = (room, station) => { for (const [ws, meta] of sockets) if (meta.room === room && meta.station === station && meta.role !== 'trainer') ws.close(4001, 'Device assignment replaced'); };
  const revoke = (room, station) => { for (const [key, value] of credentials) if (value.room === room && value.station === station) credentials.delete(key); for (const [key, value] of invites) if (value.room === room && value.station === station) invites.delete(key); disconnectStation(room, station); dirty = true; };
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
    if (req.url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const path = resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!path.startsWith(dist + sep)) throw new Error('Invalid path');
      const body = await readFile(path);
      const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' }[extname(path)] || 'application/octet-stream';
      res.writeHead(200, { 'content-type': mime, 'cache-control': extname(path) === '.html' || path.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600' }); res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404); res.end('Build ScreenForge first: npm run build'); }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 14000000 });
  server.on('upgrade', (req, socket, head) => {
    // Same-origin deployment; explicit allowlist for a separate frontend if required.
    let allowed = false;
    try { const origin = new URL(req.headers.origin); allowed = origin.host === req.headers.host || (process.env.EXERCISE_ORIGINS || '').split(',').includes(origin.origin); } catch { /* no origin */ }
    if (!allowed || req.url !== '/exercise') { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', ws => {
    const timeout = setTimeout(() => ws.close(4003, 'Authentication required'), 10000);
    let alive = true, windowStart = Date.now(), messages = 0;
    ws.on('pong', () => { alive = true; });
    const heartbeat = setInterval(() => { if (!alive) return ws.terminate(); alive = false; ws.ping(); }, 15000);
    ws.on('error', () => {});
    ws.on('message', raw => {
      try {
        if (Date.now() - windowStart > 1000) { windowStart = Date.now(); messages = 0; }
        if (++messages > 60) throw new Error('Too many requests');
        const msg = JSON.parse(String(raw));
        let meta = sockets.get(ws);
        if (msg.type === 'hello') {
          if (meta) throw new Error('Already authenticated');
          const auth = hello.parse(msg);
          if (auth.role === 'trainer') {
            if (!equal(auth.token, secret)) { send(ws, { type: 'error', message: 'Trainer key rejected' }); ws.close(4003); return; }
            if (!rooms.has(auth.room)) { if (rooms.size >= 100) throw new Error('Room limit reached'); const state = newState(auth.room); rooms.set(auth.room, state); baseline.set(auth.room, structuredClone(state.scenario)); dirty = true; }
            meta = { room: auth.room, role: 'trainer', station: '', expires: Date.now() + 43200000 };
          } else {
            const collection = auth.invite ? invites : credentials, key = hash(auth.token), value = collection.get(key);
            if (!value || value.expires < Date.now() || value.room !== auth.room || value.station !== auth.station || value.role !== auth.role) { send(ws, { type: 'error', message: 'Assignment expired or revoked. Request a new QR code.' }); ws.close(4003); return; }
            const state = rooms.get(value.room), st = state?.scenario.stations.find(s => s.id === value.station);
            if (!st || st.role !== value.role) throw new Error('Station no longer exists');
            if (auth.invite) {
              collection.delete(key); revoke(value.room, value.station);
              const session = token(); meta = { ...value, expires: Date.now() + 86400000 * 7 }; credentials.set(hash(session), meta); send(ws, { type: 'credential', token: session }); dirty = true;
            } else meta = value;
            disconnectStation(meta.room, meta.station);
            state.presence[meta.station] = { online: true, lastSeen: Date.now() };
          }
          clearTimeout(timeout); sockets.set(ws, meta); send(ws, { type: 'ready', role: meta.role, station: meta.station }); broadcast(meta.room); return;
        }
        if (!meta) throw new Error('Authenticate first');
        if (meta.expires < Date.now()) { ws.close(4003, 'Session expired'); return; }
        const state = rooms.get(meta.room);
        if (msg.type === 'signal') {
          const st = state.scenario.stations.find(s => s.id === meta.station);
          const target = [...sockets].find(([other, m]) => other !== ws && m.room === meta.room && m.station === msg.to);
          const type = msg.data?.type;
          if (!target || !['request','offer','answer','ice','stop'].includes(type) || JSON.stringify(msg.data).length > 100000) return;
          const targetStation = state.scenario.stations.find(s => s.id === target[1].station);
          const publishing = st?.scene === 'camera' && target[1].role === 'hq';
          const viewing = meta.role === 'hq' && targetStation?.scene === 'camera';
          if (!(publishing || viewing) || state.cameraOffline[publishing ? meta.station : target[1].station]) throw new Error('Camera unavailable');
          send(target[0], { type: 'signal', from: meta.station, data: msg.data }); return;
        }
        if (msg.type === 'gps' && meta.role === 'element') {
          const st = state.scenario.stations.find(s => s.id === meta.station);
          if (!st?.player || state.scenario.mode !== 'LIVE') throw new Error('Tracking unavailable for this station');
          const samples = z.array(position).min(1).max(120).parse(msg.samples).sort((a,b) => a.timestamp - b.timestamp);
          for (const p of samples) {
            if (p.timestamp > Date.now() + 30000 || p.timestamp < Date.now() - 3600000 || p.timestamp <= (state.positions[meta.station]?.timestamp || 0)) continue;
            state.positions[meta.station] = { ...p, received: Date.now() };
          }
          evaluate(state, { type: 'zone', station: meta.station });
        } else if (msg.type === 'intervention' && meta.role === 'element') {
          const st = state.scenario.stations.find(s => s.id === meta.station);
          if (state.frozen || st?.scene !== 'medical' || !['treated', 'tourniquet', 'oxygen', 'evacuated'].includes(msg.value)) throw new Error('Intervention unavailable');
          const values = state.interventions[meta.station] ||= [];
          if (!values.includes(msg.value)) { values.push(msg.value); logEvent(state, `${st.name}: ${msg.value}`); evaluate(state, { type: 'intervention', station: meta.station, value: msg.value }); }
        } else if (msg.type === 'unlock' && meta.role === 'element') {
          const st = state.scenario.stations.find(s => s.id === meta.station);
          if (state.frozen || !st || !['countdown','access','lock'].includes(st.scene) || (st.scene === 'countdown' && state.clock >= st.duration)) throw new Error('Terminal unavailable');
          if (!equal(st.code, String(msg.code))) throw new Error('Code rejected');
          if (!state.props[st.id]) { state.props[st.id] = true; logEvent(state, `${st.name}: completed`); evaluate(state, { type: 'prop', station: st.id }); }
        } else {
          if (meta.role !== 'trainer') throw new Error('Trainer permission required');
          if (msg.type === 'provision') {
            const st = state.scenario.stations.find(s => s.id === msg.station); if (!st) throw new Error('Unknown station');
            for (const [key, value] of invites) if (value.room === meta.room && value.station === st.id) invites.delete(key);
            const invitation = token(), expires = Date.now() + 600000;
            invites.set(hash(invitation), { room: meta.room, station: st.id, role: st.role, expires });
            send(ws, { type: 'invitation', token: invitation, station: st.id, role: st.role, expires }); return;
          } else if (msg.type === 'revoke') { revoke(meta.room, ident.parse(msg.station)); }
          else if (msg.type === 'configure') {
            if (!state.frozen) throw new Error('Pause the exercise before editing its scenario');
            if (msg.revision !== state.revision) throw new Error('Scenario changed elsewhere. Reload your draft.');
            const parsed = scenarioSchema.parse(msg.scenario);
            if (JSON.stringify(parsed).length > 10000000) throw new Error('Scenario too large');
            for (const st of state.scenario.stations) if (!parsed.stations.some(s => s.id === st.id && s.role === st.role)) revoke(meta.room, st.id);
            baseline.set(meta.room, structuredClone(parsed)); state.scenario = parsed; state.revision++;
            logEvent(state, 'Scenario saved');
          } else if (msg.type === 'transport') {
            if (msg.command === 'play') state.frozen = false;
            else if (msg.command === 'pause') state.frozen = true;
            else if (msg.command === 'reset') { const next = newState(meta.room, structuredClone(baseline.get(meta.room))); next.revision = state.revision + 1; next.presence = state.presence; rooms.set(meta.room, next); }
            else throw new Error('Unknown transport command');
          } else if (msg.type === 'action') {
            const action = actionSchema.parse(msg.action);
            if (action.type !== 'message') { const rows = action.type === 'patient' ? state.scenario.patients : action.type === 'release' ? state.scenario.dossiers : action.type === 'objective' ? state.scenario.objectives : state.scenario.stations; if (!rows.some(r => r.id === action.target)) throw new Error('Unknown action target'); }
            act(state, action);
          } else if (msg.type === 'patient') {
            const patient = patientSchema.parse(msg.patient), i = state.scenario.patients.findIndex(p => p.id === patient.id);
            if (i < 0) throw new Error('Unknown patient'); state.scenario.patients[i] = { ...patient, since: state.clock }; logEvent(state, `Patient adjusted: ${patient.name}`);
          } else throw new Error('Unknown command');
        }
        dirty = true; broadcast(meta.room);
      } catch (error) { send(ws, { type: 'error', message: error instanceof z.ZodError ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 3).join('; ') : error.message }); }
    });
    ws.on('close', () => { clearTimeout(timeout); clearInterval(heartbeat); const meta = sockets.get(ws); sockets.delete(ws); if (meta?.station) { const state = rooms.get(meta.room); if (state && ![...sockets.values()].some(m => m.room === meta.room && m.station === meta.station)) { state.presence[meta.station] = { online: false, lastSeen: Date.now() }; broadcast(meta.room); } } });
  });
  let last = performance.now();
  const tick = setInterval(() => { const now = performance.now(), delta = (now - last) / 1000; last = now; for (const [room, state] of rooms) { if (!state.frozen) { advance(state, delta); dirty = true; broadcast(room); } } }, 250);
  const saveTimer = setInterval(() => { for (const map of [invites, credentials]) for (const [key,value] of map) if (value.expires < Date.now()) map.delete(key); void persist(); }, 5000);
  await new Promise(resolve => server.listen(port, host, resolve));
  return { server, secret, port: server.address().port, close: async () => { clearInterval(tick); clearInterval(saveTimer); for (const ws of wss.clients) ws.terminate(); await new Promise(resolve => wss.close(resolve)); await new Promise(resolve => server.close(resolve)); await persist(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await startExercise();
  console.log(`ScreenForge: http://localhost:${app.port}/?role=trainer`);
  console.log(`Trainer key: ${app.secret}`);
  console.log('For tablets use a trusted HTTPS reverse proxy. Set EXERCISE_ADMIN_KEY to keep the trainer key across restarts.');
  for (const sig of ['SIGINT','SIGTERM']) process.once(sig, () => void app.close().then(() => process.exit()));
}
