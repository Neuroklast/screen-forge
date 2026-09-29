import { StageFrame } from "./StageFrame";
import { useExerciseMaybe } from "../core/useExercise";
import { isSceneId } from "../core/exercise";
export function ElementView({ station }: { station: string }) {
  const ex = useExerciseMaybe();
  const row = ex?.state.stations.find((s) => s.id === station);
  const scene = row?.scene && isSceneId(row.scene) ? row.scene : "medical";
  return (
    <div className="element-shell">
      <StageFrame scene={scene} mark />
    </div>
  );
}
