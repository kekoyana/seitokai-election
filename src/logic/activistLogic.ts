import type { Student, CandidateId } from '../types';

/** 生徒の最も高い思想軸を派閥として返す */
export function getStudentFaction(s: Student): CandidateId {
  const { conservative, progressive, sports } = s.support;
  if (conservative >= progressive && conservative >= sports) return 'conservative';
  if (progressive >= conservative && progressive >= sports) return 'progressive';
  return 'sports';
}

/**
 * 活動家を選出する
 * プレイヤー派閥: 最大2名、他派閥: 各最大4名
 */
export function electActivists(
  students: Student[],
  playerCharacterId: string,
  playerCandidate: CandidateId,
): string[] {
  const factions: CandidateId[] = ['conservative', 'progressive', 'sports'];
  const result: string[] = [];

  for (const faction of factions) {
    const maxCount = faction === playerCandidate ? 2 : 4;

    const candidates = students
      .filter(s =>
        !s.candidateId &&
        s.id !== playerCharacterId &&
        getStudentFaction(s) === faction &&
        s.support[faction] >= 50
      )
      .sort((a, b) => {
        const diff = b.support[faction] - a.support[faction];
        if (diff !== 0) return diff;
        return b.stats.speech - a.stats.speech;
      })
      .slice(0, maxCount);

    result.push(...candidates.map(s => s.id));
  }

  return result;
}

export const FACTION_LABELS: Record<CandidateId, string> = {
  conservative: '保守',
  progressive: '革新',
  sports: '体育',
};

export interface SingleActivistResult {
  updatedStudents: Student[];
  log: string | null;
  /** プレイヤーをターゲットにした活動家（強制バトル用） */
  playerTargetedBy: Student | null;
  playerTargetedCandidate: CandidateId | null;
}

/**
 * 1人の活動家の行動を処理する（移動ごとに呼ばれる）
 * 30%の確率で行動する
 */
export function processOneActivist(
  activistId: string,
  students: Student[],
  activists: string[],
  playerCharacterId: string,
): SingleActivistResult {
  // 30%の確率で行動
  if (Math.random() > 0.30) {
    return { updatedStudents: students, log: null, playerTargetedBy: null, playerTargetedCandidate: null };
  }

  const activist = students.find(s => s.id === activistId);
  if (!activist) {
    return { updatedStudents: students, log: null, playerTargetedBy: null, playerTargetedCandidate: null };
  }

  const activistFaction = getStudentFaction(activist);

  // ターゲット: 異なる派閥の生徒（候補者・他の活動家を除く）
  const targets = students.filter(s =>
    !s.candidateId &&
    s.id !== activistId &&
    !activists.includes(s.id) &&
    getStudentFaction(s) !== activistFaction
  );
  if (targets.length === 0) {
    return { updatedStudents: students, log: null, playerTargetedBy: null, playerTargetedCandidate: null };
  }

  const target = targets[Math.floor(Math.random() * targets.length)];

  // プレイヤーがターゲットの場合 → 強制バトル
  if (target.id === playerCharacterId) {
    return {
      updatedStudents: students,
      log: null,
      playerTargetedBy: activist,
      playerTargetedCandidate: activistFaction,
    };
  }

  // NPC同士の簡易説得判定
  const successRate = Math.max(10, Math.min(60,
    30 + (activist.stats.speech - target.stats.speech) * 0.3
  ));
  const success = (Math.random() * 100) < successRate;

  if (success) {
    const shiftAmount = 3 + Math.floor(Math.random() * 6); // 3-8
    const updatedStudents = students.map(s => {
      if (s.id !== target.id) return s;
      return applyFactionShift(s, activistFaction, shiftAmount);
    });
    return {
      updatedStudents,
      log: `${activist.name}が${target.name}を説得した（${FACTION_LABELS[activistFaction]}+${shiftAmount}）`,
      playerTargetedBy: null,
      playerTargetedCandidate: null,
    };
  }

  return {
    updatedStudents: students,
    log: `${activist.name}が${target.name}の説得に失敗した`,
    playerTargetedBy: null,
    playerTargetedCandidate: null,
  };
}

/** 指定した派閥方向に思想をシフトする（3軸合計100を維持） */
function applyFactionShift(student: Student, faction: CandidateId, amount: number): Student {
  const support = { ...student.support };
  const others = (['conservative', 'progressive', 'sports'] as CandidateId[]).filter(f => f !== faction);

  support[faction] = Math.min(100, support[faction] + amount);
  const excess = support.conservative + support.progressive + support.sports - 100;
  if (excess > 0) {
    const half = excess / 2;
    for (const other of others) {
      support[other] = Math.max(0, support[other] - half);
    }
    const total = support.conservative + support.progressive + support.sports;
    if (total !== 100) {
      support[others[0]] = Math.max(0, support[others[0]] - (total - 100));
    }
  }

  return { ...student, support };
}
