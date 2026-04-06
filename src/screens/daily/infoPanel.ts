import type { GameState, Student } from '../../types';
import {
  FACTION_INFO, FACTION_LABELS, ALL_FACTION_IDS,
  renderInitialIcon, renderSupportBar,
} from '../../data';
import { ORGANIZATIONS, SPORTS_CLUB_IDS, CULTURE_CLUB_IDS } from '../../data/organizations';
import { getOrganizationVote, calcOrganizationSupport } from '../../logic/organizationLogic';
import { t } from '../../i18n';

export interface InfoPanelState {
  tab: 'class' | 'club' | 'objective';
  subTab?: string;
  orgId?: string;
  studentId?: string;
}

export interface InfoPanelContext {
  state: GameState;
  infoPanel: InfoPanelState;
  getFactionColor: () => string;
  renderStudentDetailCard: (s: Student, backAction: string, isPlayer?: boolean) => string;
}

export function renderInfoPanel(ctx: InfoPanelContext): string {
  const { tab, orgId, studentId } = ctx.infoPanel;

  if (tab === 'objective') {
    return renderObjectivePanel(ctx);
  }

  if (orgId && studentId) {
    const student = ctx.state.students.find(s => s.id === studentId);
    if (student) return ctx.renderStudentDetailCard(student, 'back-to-org');
  }

  if (orgId) {
    const org = ORGANIZATIONS.find(o => o.id === orgId);
    if (org) return renderInfoOrgDetail(ctx, org);
  }

  return renderInfoOrgList(ctx, tab);
}

export function renderInfoHeader(title: string, backAction?: string): string {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        ${backAction ? `<button data-info-action="${backAction}" style="
          background:none; border:none; color:#4A90D9;
          font-size:1em; cursor:pointer; padding:0 4px; font-family:inherit;
        ">←</button>` : ''}
        <h3 style="font-size:0.95em; color:#333; margin:0;">${title}</h3>
      </div>
      <button data-info-action="close" style="
        background:#ddd; border:none; border-radius:50%;
        width:28px; height:28px; cursor:pointer; font-size:1em;
      ">×</button>
    </div>
  `;
}

function renderInfoTabs(activeTab: 'class' | 'club' | 'objective'): string {
  const tabStyle = (active: boolean) => `
    padding:8px 16px; border:none; border-radius:8px 8px 0 0;
    font-size:0.85em; font-weight:bold; cursor:pointer;
    font-family:inherit;
    background:${active ? '#fff' : '#e0e4e8'};
    color:${active ? '#333' : '#888'};
    border-bottom:${active ? '2px solid #4A90D9' : '2px solid transparent'};
  `;
  return `
    <div style="display:flex; gap:2px; margin-bottom:12px;">
      <button data-info-tab="class" style="${tabStyle(activeTab === 'class')}">${t('daily.tabClass')}</button>
      <button data-info-tab="club" style="${tabStyle(activeTab === 'club')}">${t('daily.tabClub')}</button>
      <button data-info-tab="objective" style="${tabStyle(activeTab === 'objective')}">${t('daily.tabObjective')}</button>
    </div>
  `;
}

function renderInfoSubTabs(tab: 'class' | 'club', activeSubTab: string): string {
  const items = tab === 'class'
    ? [{ key: 'grade1', label: t('daily.grade1') }, { key: 'grade2', label: t('daily.grade2') }, { key: 'grade3', label: t('daily.grade3') }]
    : [{ key: 'sports', label: t('daily.sports') }, { key: 'culture', label: t('daily.culture') }];

  const btnStyle = (active: boolean) => `
    padding:5px 12px; border:none; border-radius:12px;
    font-size:0.78em; font-weight:${active ? 'bold' : 'normal'}; cursor:pointer;
    font-family:inherit;
    background:${active ? '#4A90D9' : '#e8ecf0'};
    color:${active ? '#fff' : '#666'};
  `;
  return `
    <div style="display:flex; gap:4px; margin-bottom:10px;">
      ${items.map(i => `<button data-info-subtab="${i.key}" style="${btnStyle(activeSubTab === i.key)}">${i.label}</button>`).join('')}
    </div>
  `;
}

export function renderOrgInfoSection(ctx: { state: GameState }, org: typeof ORGANIZATIONS[number]): string {
  const vote = getOrganizationVote(org, ctx.state.students);
  const voteCandidate = FACTION_INFO.find(f => f.id === vote);
  const isAlly = vote === ctx.state.faction;

  const leader = ctx.state.students.find(s => s.id === org.leaderId);
  const allMemberIds = [org.leaderId, ...org.subLeaderIds, ...org.memberIds];
  const totalMembers = allMemberIds.length;

  const orgSupport = calcOrganizationSupport(org, ctx.state.students);

  return `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
      <span style="
        font-size:0.75em; padding:2px 8px; border-radius:4px;
        background:${(voteCandidate?.color ?? '#888')}30;
        color:${voteCandidate?.color ?? '#888'};
        border:1px solid ${(voteCandidate?.color ?? '#888')}50;
        font-weight:bold;
      ">${FACTION_LABELS[vote] ?? ''}派${isAlly ? ' ✓' : ''}</span>
    </div>
    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; font-size:0.72em; color:var(--game-text-dim);">
      <span>代表: <strong style="color:var(--game-text);">${leader?.name ?? '?'}</strong></span>
      <span style="opacity:0.4;">|</span>
      <span>${totalMembers}名</span>
    </div>
    <div style="font-size:0.72em; color:var(--game-text-dim); margin-bottom:6px; line-height:1.5;">${org.description}</div>
    ${renderSupportBar(orgSupport, 14, true)}
  `;
}

function renderObjectivePanel(ctx: InfoPanelContext): string {
  const faction = ctx.state.faction;
  const factionInfo = FACTION_INFO.find(f => f.id === faction);
  const factionLabel = faction ? FACTION_LABELS[faction] : '???';
  const factionColor = factionInfo?.color ?? '#888';

  const classOrgs = ORGANIZATIONS.filter(o => o.id.startsWith('class'));
  const clubOrgs = ORGANIZATIONS.filter(o => o.id.startsWith('club_'));
  const allOrgs = [...classOrgs, ...clubOrgs];
  const allyCount = allOrgs.filter(org => getOrganizationVote(org, ctx.state.students) === faction).length;
  const totalCount = allOrgs.length;
  const remainDays = Math.max(0, 30 - ctx.state.day);

  return `
    <div class="game-panel" style="padding:14px;">
      ${renderInfoHeader('情報')}
      ${renderInfoTabs('objective')}

      <div style="font-size:0.95em; font-weight:bold; color:var(--game-heading); margin-bottom:10px; text-align:center;">
        学園祭の企画投票で<span style="color:${factionColor};">${factionLabel}派</span>を勝利させよう！
      </div>

      <div style="background:var(--game-panel-inner); border-radius:8px; padding:10px; margin-bottom:10px; font-size:0.8em; line-height:1.7; color:var(--game-text);">
        学園祭を外部公開するか、伝統を守るか、体育祭に変えるか——<br>
        <strong>30日間</strong>で生徒たちを説得し、各組織（クラス・部活）の支持を集めよう。
      </div>

      <div style="font-size:0.82em; color:var(--game-text); margin-bottom:8px;">
        <strong>勝利条件</strong>（どちらかを達成）
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
        <div style="background:rgba(126,200,80,0.1); border:1px solid rgba(126,200,80,0.3); border-radius:6px; padding:8px 10px; font-size:0.78em; line-height:1.5;">
          <strong style="color:#7EC850;">① 投票日に過半数の組織を支持させる</strong><br>
          <span style="color:var(--game-text-dim);">30日後の投票で最も支持を集めた派閥が勝利</span>
        </div>
        <div style="background:rgba(126,200,80,0.1); border:1px solid rgba(126,200,80,0.3); border-radius:6px; padding:8px 10px; font-size:0.78em; line-height:1.5;">
          <strong style="color:#7EC850;">② 全組織の支持を統一する</strong><br>
          <span style="color:var(--game-text-dim);">全クラス・部活を自派閥に引き込めば即座にクリア</span>
        </div>
      </div>

      <div style="font-size:0.82em; color:var(--game-text); margin-bottom:8px;">
        <strong>現在の状況</strong>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.8em; margin-bottom:12px;">
        <div style="background:var(--game-panel-inner); border-radius:6px; padding:8px; text-align:center;">
          <div style="color:var(--game-text-dim); font-size:0.85em;">支持組織</div>
          <div style="font-size:1.3em; font-weight:bold; color:${factionColor};">${allyCount}<span style="font-size:0.6em; color:var(--game-text-dim);">/${totalCount}</span></div>
        </div>
        <div style="background:var(--game-panel-inner); border-radius:6px; padding:8px; text-align:center;">
          <div style="color:var(--game-text-dim); font-size:0.85em;">残り日数</div>
          <div style="font-size:1.3em; font-weight:bold; color:var(--game-text);">${remainDays}<span style="font-size:0.6em; color:var(--game-text-dim);">日</span></div>
        </div>
      </div>

      <div style="font-size:0.82em; color:var(--game-text); margin-bottom:8px;">
        <strong>攻略のコツ</strong>
      </div>
      <div style="font-size:0.78em; color:var(--game-text-dim); line-height:1.7;">
        ・生徒と<strong>雑談</strong>して趣味や好みを知ろう<br>
        ・<strong>説得バトル</strong>で組織のキーパーソンを味方につけよう<br>
        ・雑談で<strong>機嫌を上げてから</strong>思想を語ると効果的<br>
        ・組織の<strong>代表</strong>を説得すると支持が大きく動く
      </div>
    </div>
  `;
}

function renderInfoOrgList(ctx: InfoPanelContext, tab: 'class' | 'club'): string {
  const candidateColor = ctx.getFactionColor();
  const subTab = ctx.infoPanel.subTab ?? (tab === 'class' ? 'grade1' : 'sports');

  const allOrgs = tab === 'class'
    ? ORGANIZATIONS.filter(o => o.id.startsWith('class'))
    : ORGANIZATIONS.filter(o => o.id.startsWith('club_'));

  const orgs = tab === 'class'
    ? allOrgs.filter(o => o.id.startsWith(`class${subTab.replace('grade', '')}`))
    : subTab === 'sports'
      ? allOrgs.filter(o => SPORTS_CLUB_IDS.has(o.id))
      : allOrgs.filter(o => CULTURE_CLUB_IDS.has(o.id));

  const allAllyCount = allOrgs.filter(org =>
    getOrganizationVote(org, ctx.state.students) === ctx.state.faction
  ).length;

  const orgRows = orgs.map(org => {
    const vote = getOrganizationVote(org, ctx.state.students);
    const voteCandidate = FACTION_INFO.find(f => f.id === vote);
    const isAlly = vote === ctx.state.faction;
    const leader = ctx.state.students.find(s => s.id === org.leaderId);

    return `
      <button data-info-org="${org.id}" style="
        display:flex; align-items:center; gap:8px; width:100%;
        padding:8px; border-radius:8px;
        background:${isAlly ? `${voteCandidate?.color ?? '#888'}10` : 'rgba(255,255,255,0.5)'};
        border:1px solid ${isAlly ? `${voteCandidate?.color ?? '#888'}30` : '#e8f0f8'};
        margin-bottom:4px; cursor:pointer;
        text-align:left; font-family:inherit;
      ">
        ${leader ? (leader.portrait
          ? `<img src="${leader.portrait}" alt="${leader.name}" style="
              width:72px; height:72px; border-radius:50%;
              object-fit:cover; object-position:top;
              border:2px solid ${voteCandidate?.color ?? '#ddd'};
              flex-shrink:0;
            "/>`
          : renderInitialIcon(leader.name, leader.personality, 72, voteCandidate?.color ?? '#ddd')
        ) : ''}
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.88em; font-weight:bold; color:#333;">${org.name}</span>
          </div>
          <div style="font-size:0.72em; color:#888;">代表: ${leader?.name ?? '不明'}</div>
          <div style="font-size:0.68em; color:#999; margin-top:2px; line-height:1.4;">${org.description}</div>
        </div>
        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
          <span style="
            font-size:0.75em; padding:2px 8px; border-radius:8px;
            background:${(voteCandidate?.color ?? '#888')}15;
            color:${voteCandidate?.color ?? '#888'};
            border:1px solid ${(voteCandidate?.color ?? '#888')}33;
            font-weight:${isAlly ? 'bold' : 'normal'};
          ">${FACTION_LABELS[vote] ?? ''}派${isAlly ? ' ✓' : ''}</span>
          <span style="color:#bbb; font-size:0.8em;">›</span>
        </div>
      </button>
    `;
  }).join('');

  return `
    <div class="game-panel" style="
      padding:14px;
    ">
      ${renderInfoHeader('情報')}
      ${renderInfoTabs(tab)}
      ${renderInfoSubTabs(tab, subTab)}

      <div style="
        background:${candidateColor}10; border:1px solid ${candidateColor}30;
        border-radius:8px; padding:6px 12px; margin-bottom:12px;
        font-size:0.8em; color:#555; text-align:center;
      ">
        味方: <strong style="color:${candidateColor};">${allAllyCount}</strong> / ${allOrgs.length}${tab === 'class' ? '組' : '部'}
      </div>

      ${orgRows}
    </div>
  `;
}

function renderInfoOrgDetail(ctx: InfoPanelContext, org: typeof ORGANIZATIONS[number]): string {
  const allMemberIds = [org.leaderId, ...org.subLeaderIds, ...org.memberIds];
  const members = allMemberIds.map(id => {
    const s = ctx.state.students.find(st => st.id === id);
    const role = id === org.leaderId
      ? (org.leaderTitle ?? '代表')
      : org.subLeaderIds.includes(id)
        ? (org.subLeaderTitle ?? '副代表')
        : 'メンバー';
    return s ? { student: s, role } : null;
  }).filter((m): m is { student: Student; role: string } => m !== null);

  const memberRows = members.map(({ student: s, role }) => {
    const sup = s.support;
    const maxKey = ALL_FACTION_IDS
      .reduce((a, b) => sup[a] >= sup[b] ? a : b);
    const sc = FACTION_INFO.find(f => f.id === maxKey);
    const roleColor = role === '代表' ? '#E74C3C' : role === '副代表' ? '#E07820' : 'var(--game-text-dim)';

    return `
      <button data-info-student="${s.id}" style="
        display:flex; align-items:center; gap:8px; width:100%;
        padding:6px 8px; border-radius:8px;
        background:rgba(255,255,255,0.5);
        border:1px solid var(--game-panel-inner);
        margin-bottom:3px; cursor:pointer;
        text-align:left; font-family:inherit;
      ">
        ${s.portrait
          ? `<img src="${s.portrait}" alt="${s.name}" style="
              width:72px; height:72px; border-radius:50%;
              object-fit:cover; object-position:top;
              border:2px solid ${sc?.color ?? '#ddd'}; flex-shrink:0;
            "/>`
          : renderInitialIcon(s.name, s.personality, 72, sc?.color ?? '#ddd')
        }
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:4px;">
            <span style="font-size:0.85em; font-weight:bold; color:var(--game-text);">${s.name}</span>
            <span style="font-size:0.65em; color:var(--game-text-dim);">（${s.nickname}）</span>
            <span style="font-size:0.6em; color:${roleColor}; font-weight:bold;">${role}</span>
          </div>
          <div style="font-size:0.68em; color:var(--game-text-dim);">${s.className}</div>
        </div>
        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
          <span style="
            font-size:0.7em; padding:1px 6px; border-radius:6px;
            background:${(sc?.color ?? '#888')}15; color:${sc?.color ?? '#888'};
            border:1px solid ${(sc?.color ?? '#888')}30;
          ">${FACTION_LABELS[maxKey] ?? ''}</span>
          <span style="color:var(--game-text-dim); font-size:0.8em;">›</span>
        </div>
      </button>
    `;
  }).join('');

  return `
    <div class="game-panel" style="padding:14px;">
      ${renderInfoHeader(org.name, 'back-to-list')}

      <div style="
        background:var(--game-panel-inner); border-radius:8px;
        padding:10px; margin-bottom:12px;
      ">
        ${renderOrgInfoSection(ctx, org)}
      </div>

      <div style="font-size:0.78em; color:var(--game-text-dim); margin-bottom:6px; font-weight:bold;">
        メンバー（${members.length}名）
      </div>
      ${memberRows}
    </div>
  `;
}
