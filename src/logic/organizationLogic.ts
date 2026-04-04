import type { Organization, Student, CandidateId } from '../types';

type SupportVec = { conservative: number; progressive: number; sports: number };

function getStudentSupport(id: string, students: Student[]): SupportVec | null {
  const s = students.find(st => st.id === id);
  return s ? s.support : null;
}

function getSupportCandidate(vec: SupportVec): CandidateId {
  return (['conservative', 'progressive', 'sports'] as CandidateId[])
    .reduce((a, b) => vec[a] >= vec[b] ? a : b);
}

function blendSupport(vecs: SupportVec[]): SupportVec {
  if (vecs.length === 0) return { conservative: 0, progressive: 0, sports: 0 };
  const sum = vecs.reduce(
    (acc, v) => ({
      conservative: acc.conservative + v.conservative,
      progressive: acc.progressive + v.progressive,
      sports: acc.sports + v.sports,
    }),
    { conservative: 0, progressive: 0, sports: 0 }
  );
  const n = vecs.length;
  return {
    conservative: sum.conservative / n,
    progressive: sum.progressive / n,
    sports: sum.sports / n,
  };
}

function weightedBlend(vecs: { vec: SupportVec; weight: number }[]): SupportVec {
  const totalWeight = vecs.reduce((a, v) => a + v.weight, 0);
  if (totalWeight === 0) return { conservative: 0, progressive: 0, sports: 0 };
  const sum = vecs.reduce(
    (acc, { vec, weight }) => ({
      conservative: acc.conservative + vec.conservative * weight,
      progressive: acc.progressive + vec.progressive * weight,
      sports: acc.sports + vec.sports * weight,
    }),
    { conservative: 0, progressive: 0, sports: 0 }
  );
  return {
    conservative: sum.conservative / totalWeight,
    progressive: sum.progressive / totalWeight,
    sports: sum.sports / totalWeight,
  };
}

// 組織の支持候補を計算する
export function calcOrganizationSupport(
  org: Organization,
  students: Student[]
): SupportVec {
  const leaderSupport = getStudentSupport(org.leaderId, students);
  if (!leaderSupport) return { conservative: 0, progressive: 0, sports: 0 };

  const subLeaderSupports = org.subLeaderIds
    .map(id => getStudentSupport(id, students))
    .filter((v): v is SupportVec => v !== null);

  const memberSupports = org.memberIds
    .map(id => getStudentSupport(id, students))
    .filter((v): v is SupportVec => v !== null);

  switch (org.type) {
    case 'dictatorship': {
      // 代表80% + 副代表平均20%
      if (subLeaderSupports.length === 0) return leaderSupport;
      const subAvg = blendSupport(subLeaderSupports);
      return weightedBlend([
        { vec: leaderSupport, weight: 80 },
        { vec: subAvg, weight: 20 },
      ]);
    }

    case 'council': {
      // 代表40% + 副代表平均40% + メンバー平均20%
      if (subLeaderSupports.length === 0 && memberSupports.length === 0) return leaderSupport;
      const parts: { vec: SupportVec; weight: number }[] = [
        { vec: leaderSupport, weight: 40 },
      ];
      if (subLeaderSupports.length > 0) {
        parts.push({ vec: blendSupport(subLeaderSupports), weight: 40 });
      }
      if (memberSupports.length > 0) {
        parts.push({ vec: blendSupport(memberSupports), weight: 20 });
      }
      return weightedBlend(parts);
    }

    case 'delegation': {
      // 代表20% + 副代表平均60% + メンバー平均20%
      if (subLeaderSupports.length === 0 && memberSupports.length === 0) return leaderSupport;
      const parts: { vec: SupportVec; weight: number }[] = [
        { vec: leaderSupport, weight: 20 },
      ];
      if (subLeaderSupports.length > 0) {
        parts.push({ vec: blendSupport(subLeaderSupports), weight: 60 });
      }
      if (memberSupports.length > 0) {
        parts.push({ vec: blendSupport(memberSupports), weight: 20 });
      }
      return weightedBlend(parts);
    }

    case 'majority': {
      // 全メンバーの支持候補を数え最多票を返す。同数なら代表で決定
      const allIds = [org.leaderId, ...org.subLeaderIds, ...org.memberIds];
      const allSupports = allIds
        .map(id => getStudentSupport(id, students))
        .filter((v): v is SupportVec => v !== null);

      const counts: SupportVec = {
        conservative: 0,
        progressive: 0,
        sports: 0,
      };
      for (const sv of allSupports) {
        counts[getSupportCandidate(sv)]++;
      }
      return counts;
    }

    default:
      return leaderSupport;
  }
}

// 組織の支持候補(CandidateId)を返す
export function getOrganizationVote(
  org: Organization,
  students: Student[]
): CandidateId {
  const support = calcOrganizationSupport(org, students);
  const maxVal = Math.max(support.conservative, support.progressive, support.sports);
  const winners = (['conservative', 'progressive', 'sports'] as CandidateId[])
    .filter(k => support[k] === maxVal);
  // 同数時は代表の支持で決定（majority以外では通常発生しない）
  if (winners.length > 1) {
    const leaderSupport = getStudentSupport(org.leaderId, students);
    if (leaderSupport) return getSupportCandidate(leaderSupport);
  }
  return winners[0];
}
