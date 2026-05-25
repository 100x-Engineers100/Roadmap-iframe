'use client';

import { useReducer, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleInput } from '@/components/screens/RoleInput';
import { TaskSliders } from '@/components/screens/TaskSliders';
import { Calculating } from '@/components/screens/Calculating';
import { ScoreReveal } from '@/components/screens/ScoreReveal';
import { GapView } from '@/components/screens/GapView';
import { EmailGate } from '@/components/screens/EmailGate';
import { RoadmapView } from '@/components/screens/RoadmapView';
import type {
  SOCMatch,
  OnetTask,
  TaskWeight,
  AiFamiliarity,
  RoleCategory,
  ScoreBand,
  SkillGapResult,
  Roadmap,
} from '@/types';

// ── State ────────────────────────────────────────────────────────────────────

interface AssessState {
  step: 2 | 3 | 4 | 5 | 6 | 7 | 8;
  input: string;
  socMatch: SOCMatch | null;
  roleCategory: RoleCategory | null;
  tasks: OnetTask[];
  taskWeights: Record<string, TaskWeight>;
  confirmedClusterIds: string[];
  aiFamiliarity: AiFamiliarity;
  riskScore: number | null;
  scoreBand: ScoreBand | null;
  skillGap: SkillGapResult | null;
  fallbackUsed: boolean;
  roadmap: Roadmap | null;
}

type Action =
  | { type: 'CONFIRM_SOC'; soc: SOCMatch; tasks: OnetTask[]; role: RoleCategory; input: string }
  | { type: 'SUBMIT_WEIGHTS'; weights: Record<string, TaskWeight>; confirmedClusterIds: string[]; aiFamiliarity: AiFamiliarity }
  | { type: 'SET_SCORE'; score: number; band: ScoreBand; skillGap: SkillGapResult; fallbackUsed: boolean; aiFamiliarity: AiFamiliarity }
  | { type: 'ADVANCE_TO_GAP' }
  | { type: 'ADVANCE_TO_EMAIL' }
  | { type: 'SET_ROADMAP'; roadmap: Roadmap }
  | { type: 'GO_BACK' };

const initialState: AssessState = {
  step: 2,
  input: '',
  socMatch: null,
  roleCategory: null,
  tasks: [],
  taskWeights: {},
  confirmedClusterIds: [],
  aiFamiliarity: 'none',
  riskScore: null,
  scoreBand: null,
  skillGap: null,
  fallbackUsed: false,
  roadmap: null,
};

function reducer(state: AssessState, action: Action): AssessState {
  switch (action.type) {
    case 'CONFIRM_SOC':
      return {
        ...state,
        step: 3,
        input: action.input,
        socMatch: action.soc,
        tasks: action.tasks,
        roleCategory: action.role,
        taskWeights: Object.fromEntries(
          action.tasks.map((t) => [t.id, 'medium' as TaskWeight])
        ),
      };
    case 'SUBMIT_WEIGHTS':
      return {
        ...state,
        step: 4,
        taskWeights: action.weights,
        confirmedClusterIds: action.confirmedClusterIds,
        aiFamiliarity: action.aiFamiliarity,
      };
    case 'SET_SCORE':
      return {
        ...state,
        step: 5,
        riskScore: action.score,
        scoreBand: action.band,
        skillGap: action.skillGap,
        fallbackUsed: action.fallbackUsed,
        aiFamiliarity: action.aiFamiliarity,
      };
    case 'ADVANCE_TO_GAP':
      return { ...state, step: 6 };
    case 'ADVANCE_TO_EMAIL':
      return { ...state, step: 7 };
    case 'SET_ROADMAP':
      return { ...state, step: 8, roadmap: action.roadmap };
    case 'GO_BACK':
      if (state.step === 3) return { ...state, step: 2 };
      return state;
    default:
      return state;
  }
}

// ── Score API response ────────────────────────────────────────────────────────

interface ScoreApiResponse {
  score: number;
  band: ScoreBand;
  skill_gap: SkillGapResult;
  base_source: 'llm_exposure' | 'role_fallback';
  ai_familiarity: AiFamiliarity;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AssessPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const scorePromiseRef = useRef<Promise<ScoreApiResponse> | null>(null);

  useEffect(() => {
    if (state.step !== 4) return;
    const { socMatch, tasks, taskWeights, roleCategory } = state;
    if (!socMatch || !roleCategory || tasks.length === 0) return;

    scorePromiseRef.current = fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soc_code: socMatch.soc_code,
        tasks,
        task_weights: taskWeights,
        role_category: roleCategory,
        confirmed_cluster_ids: state.confirmedClusterIds,
        ai_familiarity: state.aiFamiliarity,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Score API ${res.status}`);
      return res.json() as Promise<ScoreApiResponse>;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  const handleCalculatingDone = useCallback(async () => {
    try {
      const data = await (scorePromiseRef.current ?? Promise.reject(new Error('No score promise')));
      dispatch({
        type: 'SET_SCORE',
        score: data.score,
        band: data.band,
        skillGap: data.skill_gap,
        fallbackUsed: data.base_source === 'role_fallback',
        aiFamiliarity: data.ai_familiarity ?? 'none',
      });
    } catch (err) {
      console.error('Score calculation failed:', err);
      dispatch({
        type: 'SET_SCORE',
        score: 50,
        band: 'MODERATE',
        skillGap: { green: [], red: [] },
        fallbackUsed: true,
        aiFamiliarity: state.aiFamiliarity,
      });
    }
  }, []);

  // Screen 8 (RoadmapView) is full-page — render outside AnimatePresence
  if (state.step === 8 && state.roadmap && state.roleCategory && state.socMatch) {
    return (
      <RoadmapView
        roadmap={state.roadmap}
        roleCategory={state.roleCategory}
        socTitle={state.socMatch.title}
      />
    );
  }

  return (
    <main style={{ background: 'var(--color-bg)' }}>
      <AnimatePresence mode="wait">
        {state.step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <RoleInput
              savedInput={state.input}
              savedMatch={state.socMatch}
              onConfirm={(soc, tasks, role, input) =>
                dispatch({ type: 'CONFIRM_SOC', soc, tasks, role, input })
              }
            />
          </motion.div>
        )}

        {state.step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <TaskSliders
              tasks={state.tasks}
              weights={state.taskWeights}
              onBack={() => dispatch({ type: 'GO_BACK' })}
              onSubmit={(weights, confirmedClusterIds, aiFamiliarity) =>
                dispatch({ type: 'SUBMIT_WEIGHTS', weights, confirmedClusterIds, aiFamiliarity })
              }
            />
          </motion.div>
        )}

        {state.step === 4 && (
          <Calculating key="step-4" onComplete={handleCalculatingDone} />
        )}

        {state.step === 5 && state.riskScore !== null && state.scoreBand && state.roleCategory && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <ScoreReveal
              score={state.riskScore}
              band={state.scoreBand}
              roleCategory={state.roleCategory}
              fallbackUsed={state.fallbackUsed}
              onAdvance={() => dispatch({ type: 'ADVANCE_TO_GAP' })}
            />
          </motion.div>
        )}

        {state.step === 6 && state.skillGap && state.roleCategory && (
          <motion.div
            key="step-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <GapView
              skillGap={state.skillGap}
              roleCategory={state.roleCategory}
              onAdvance={() => dispatch({ type: 'ADVANCE_TO_EMAIL' })}
            />
          </motion.div>
        )}

        {state.step === 7 &&
          state.riskScore !== null &&
          state.scoreBand &&
          state.roleCategory &&
          state.socMatch &&
          state.skillGap && (
          <motion.div
            key="step-7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <EmailGate
              roleCategory={state.roleCategory}
              socCode={state.socMatch.soc_code}
              socTitle={state.socMatch.title}
              riskScore={state.riskScore}
              scoreBand={state.scoreBand}
              tasks={state.tasks}
              taskWeights={state.taskWeights}
              skillGap={state.skillGap}
              aiFamiliarity={state.aiFamiliarity}
              onRoadmapReady={(roadmap) => dispatch({ type: 'SET_ROADMAP', roadmap })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
