import { t, type Locale } from "../../i18n";
import type {
  TerminologySetting,
  UiDensity,
} from "../../core/terminology/types";
import { useTerminology } from "./useTerminology";

const PROFILES: TerminologySetting[] = [
  "general",
  "professional",
  "military",
  "spezkr",
];
const DENSITIES: UiDensity[] = ["simple", "operational", "full"];

// Three independent settings: language, terminology profile and UI density.
// They are deliberately not a single "tactical mode" switch.
export function TerminologySettings() {
  const {
    locale,
    setLocale,
    terminology,
    setTerminology,
    density,
    setDensity,
  } = useTerminology();
  return (
    <div className="terminology-settings">
      <label>
        {t("terminology.language")}
        <select
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
        >
          <option value="en">{t("terminology.language.en")}</option>
          <option value="de">{t("terminology.language.de")}</option>
        </select>
      </label>
      <label>
        {t("terminology.profile")}
        <select
          value={terminology}
          onChange={(event) =>
            setTerminology(event.target.value as TerminologySetting)
          }
        >
          {PROFILES.map((profile) => (
            <option key={profile} value={profile}>
              {t(`terminology.profile.${profile}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("terminology.density")}
        <select
          value={density}
          onChange={(event) => setDensity(event.target.value as UiDensity)}
        >
          {DENSITIES.map((level) => (
            <option key={level} value={level}>
              {t(`terminology.density.${level}`)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
