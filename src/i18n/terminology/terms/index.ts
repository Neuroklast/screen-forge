import type { TacticalTerm } from "../../../core/terminology/types";
import { commandTerms } from "./command";
import { communicationsTerms } from "./communications";
import { forcesTerms } from "./forces";
import { locationTerms } from "./location";
import { logisticsTerms } from "./logistics";
import { medicalTerms } from "./medical";
import { navTerms } from "./nav";
import { planningTerms } from "./planning";
import { reportingTerms } from "./reporting";
import { safetyTerms } from "./safety";
import { situationTerms } from "./situation";
import { statusTerms } from "./status";
import { timeTerms } from "./time";
import { trainingTerms } from "./training";

export const allTerms: TacticalTerm[] = [
  ...commandTerms,
  ...situationTerms,
  ...forcesTerms,
  ...locationTerms,
  ...reportingTerms,
  ...communicationsTerms,
  ...statusTerms,
  ...timeTerms,
  ...trainingTerms,
  ...planningTerms,
  ...logisticsTerms,
  ...safetyTerms,
  ...medicalTerms,
  ...navTerms,
];
