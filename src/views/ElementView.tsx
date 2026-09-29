import { StageFrame } from './StageFrame';
import { useTraining } from '../core/useExercise';
import { TacticalMap } from '../training/TacticalMap';
import { CameraFeed } from '../training/CameraFeed';
import { DeviceTools } from '../training/DeviceTools';
import { DossierCards } from '../training/Dossiers';
import { TrainingTerminal } from '../training/TrainingTerminal';
export function ElementView({ station }: { station: string }) {
  const ex = useTraining(), row = ex.state.scenario.stations.find(s => s.id === station);
  if (!row) return <main className="training-app"><h1>Station nicht mehr verfügbar</h1><p>Bitte beim Trainer einen neuen QR-Code anfordern.</p></main>;
  return <main className="training-app field-view"><header className="field-header"><b>{row.name}</b><span>{row.team} · {ex.state.frozen ? 'PAUSIERT' : ex.state.scenario.mode} · EXERCISE</span></header>{row.scene === 'tracking' ? <><TacticalMap /><section className="panel"><h2>Auftrag</h2>{ex.state.scenario.objectives.map(o => <p key={o.id}>{ex.state.completed.includes(o.id) ? 'Abgeschlossen' : 'Offen'}: {o.name}</p>)}</section></> : row.scene === 'camera' ? <CameraFeed station={row.id} publish /> : row.scene === 'terminal' ? <DossierCards dossiers={ex.state.scenario.dossiers} /> : ['countdown','access','lock'].includes(row.scene) ? <TrainingTerminal station={row} /> : <StageFrame key={`${row.scene}:${row.entityId}`} scene={row.scene} mark />}{row.scene === 'medical' && <section className="panel"><p>{ex.state.scenario.patients.find(p => p.id === row.entityId)?.injuries}</p><div className="button-row">{[['treated','Behandlung melden'],['tourniquet','Tourniquet gemeldet'],['oxygen','Sauerstoff gemeldet'],['evacuated','Evakuierung gemeldet']].map(([value,label]) => <button key={value} disabled={!ex.online || ex.state.frozen} onClick={() => ex.send({ type: 'intervention', value })}>{label}</button>)}</div><small>Simulierte Werte. Maßnahmen werden protokolliert, ihre Wirkung legt das Szenario fest.</small></section>}<DeviceTools /></main>;
}
