import {
  splitTeamTemplates,
  teamTemplate,
  teamTemplateLabel,
  type TeamTemplate,
} from "../../teamTemplates.ts";
import { scenarioCapabilities } from "../../capabilities.ts";
import { defaultCallsignScheme, renderCallsign } from "../../callsigns.ts";
import { teamRoleLabel } from "../../roles.ts";
import { factString } from "../facts.ts";
import { generatedId, makeSuggestionId } from "../meta.ts";
import {
  guidedDomainScenarioType,
  type DomainPack,
  type GeneratedMeta,
  type GuidedDomain,
  type GuidedQuestion,
  type GuidedRule,
  type ScenarioOperation,
  type Suggestion,
} from "../types.ts";

// Organization (guided integration): ask for the team kind, offer the template's
// recommended composition, then only ask about deviations. The rule never
// mutates; it emits a deterministic suggestion that reconcile can revoke.
const RULE_TEAM = "org-team";
const FACT_KIND = "org.teamKind";
const FACT_DEVIATION = "org.deviation";

export type Deviation = "as-recommended" | "smaller" | "larger";

function meta(ruleId: string, subjectKey: string): GeneratedMeta {
  return { source: "guided", ruleId, subjectKey, userModified: false };
}

// Recommended composition, adjusted only by an explicit deviation. `smaller`
// drops optional slots; `larger` adds one to each required slot, but the total
// never exceeds the template's own `size.max`.
export function compositionFor(
  template: TeamTemplate,
  deviation: Deviation,
): { roleId: string; count: number }[] {
  const rows = template.roles.map((slot) => ({
    roleId: slot.roleId,
    count:
      deviation === "smaller" ? (slot.required ? slot.min : 0) : slot.recommended,
  }));
  if (deviation === "larger") {
    // Add one seat at a time, never above a slot's own max and never above the
    // template's total ceiling. Starting from `recommended` guarantees that
    // "larger" is a superset of "recommended", never a truncation of it.
    let total = rows.reduce((sum, row) => sum + row.count, 0);
    for (let index = 0; index < template.roles.length; index++) {
      const slot = template.roles[index];
      if (!slot.required) continue;
      while (rows[index].count < slot.max && total < template.size.max) {
        rows[index].count += 1;
        total += 1;
      }
    }
  }
  return rows.filter((row) => row.count > 0);
}

// The recommended team templates for a domain, plus a "no team" escape. Label
// keys are the shared `teamTemplate.*` keys, so a rename never drifts.
export function organizationQuestions(
  domain: GuidedDomain,
): GuidedQuestion[] {
  const templates = splitTeamTemplates(
    guidedDomainScenarioType[domain],
  ).recommended;
  return [
    {
      id: "q.org.team-kind",
      domain,
      group: "org.team",
      labelKey: "guided.org.teamKind.label",
      priority: "useful",
      dependsOn: [],
      appliesWhen: () => true,
      // Hidden when the scenario cannot show a team, even if the pack is active.
      appliesToScenario: (scenario) => scenarioCapabilities(scenario).teams,
      options: [
        ...templates.map((template) => ({
          id: template.id,
          labelKey: `teamTemplate.${template.id}`,
          effects: [{ fact: FACT_KIND, value: template.id }],
        })),
        {
          id: "none",
          labelKey: "guided.org.teamKind.none",
          effects: [{ fact: FACT_KIND, value: "" }],
        },
      ],
    },
    {
      id: "q.org.deviation",
      domain,
      group: "org.deviation",
      labelKey: "guided.org.deviation.label",
      priority: "useful",
      dependsOn: [FACT_KIND],
      appliesWhen: (facts) => !!factString(facts, FACT_KIND),
      appliesToScenario: (scenario) => scenarioCapabilities(scenario).teams,
      options: [
        {
          id: "as-recommended",
          labelKey: "guided.org.deviation.asRecommended",
          effects: [{ fact: FACT_DEVIATION, value: "as-recommended" }],
        },
        {
          id: "smaller",
          labelKey: "guided.org.deviation.smaller",
          effects: [{ fact: FACT_DEVIATION, value: "smaller" }],
        },
        {
          id: "larger",
          labelKey: "guided.org.deviation.larger",
          effects: [{ fact: FACT_DEVIATION, value: "larger" }],
        },
      ],
    },
  ];
}

export function organizationRule(domain: GuidedDomain): GuidedRule {
  return {
    id: RULE_TEAM,
    domain,
    dependsOn: [FACT_KIND, FACT_DEVIATION],
    evaluate(ctx): Suggestion[] {
      const kind = factString(ctx.facts, FACT_KIND);
      if (!kind) return [];
      const template = teamTemplate(kind);
      if (!template) return [];
      // A team only exists where the scenario can show one. The organization
      // step is therefore only wired into team-capable packs, and this guard
      // also covers a scenario whose capability was switched off by hand.
      if (!scenarioCapabilities(ctx.scenario).teams) return [];
      const raw = factString(ctx.facts, FACT_DEVIATION) ?? "as-recommended";
      const deviation: Deviation =
        raw === "smaller" || raw === "larger" ? raw : "as-recommended";
      const subject = "main";
      const origin = meta(RULE_TEAM, subject);
      const scheme = template.callsignScheme ?? defaultCallsignScheme;
      // Element 1 keeps the callsign deterministic; a second guided team is a
      // deliberate deviation, not something the rule should invent.
      const callsign = renderCallsign(scheme, 1);
      // The id is keyed by the kind, so switching the kind offers a new team and
      // leaves the old one for reconciliation instead of rewriting it in place.
      const teamId = generatedId(RULE_TEAM, subject, `team-${template.id}`);
      const operations: ScenarioOperation[] = [
        {
          op: "add-team",
          team: {
            id: teamId,
            name: callsign,
            templateId: template.id,
            callsign,
            origin,
          },
        },
      ];
      let member = 0;
      for (const slot of compositionFor(template, deviation))
        for (let i = 0; i < slot.count; i++) {
          member += 1;
          operations.push({
            op: "add-station",
            station: {
              // Ids are keyed by kind and role slot, so growing the team only
              // appends new participants, and switching the kind never rewrites
              // an existing participant in place.
              id: generatedId(
                RULE_TEAM,
                subject,
                `${template.id}-${slot.roleId}-${i}`,
              ),
              name: `${renderCallsign(scheme, 1, member)} · ${teamRoleLabel(slot.roleId)}`,
              role: "element",
              module: "tracking",
              player: true,
              team: teamId,
              roleId: slot.roleId,
              origin,
            },
          });
        }
      return [
        {
          id: makeSuggestionId(RULE_TEAM, subject, { teamKind: kind, deviation }),
          ruleId: RULE_TEAM,
          subjectKey: subject,
          reason: {
            key: "guided.reason.org-team",
            params: { template: teamTemplateLabel(kind), size: member },
          },
          operations,
        },
      ];
    },
  };
}

// The pack-level wiring: same questions and rule in every pack that wants the
// organization step. The engine collapses duplicate question ids across packs.
export function withOrganization(pack: DomainPack): DomainPack {
  return {
    ...pack,
    questions: [...pack.questions, ...organizationQuestions(pack.id)],
    rules: [...pack.rules, organizationRule(pack.id)],
  };
}
