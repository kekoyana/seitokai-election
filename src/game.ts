import type {
  GameState, Student, FactionId, LocationId, Floor,
  PlayerAttitude, Topic, Stance, HobbyTopic
} from './types';
import {
  STUDENTS, getFloorFromLocation, getCorridorForFloor,
  FLOOR_ADJACENCY, MOVE_COST, getFloorMoveCost, TIME_COST, MAX_TIME,
  getStudentLocation, FACTION_INFO, FACTION_LABELS, CLASS_LOCATION_MAP, ALL_FACTION_IDS, CLUB_LABELS,
} from './data';
import { generateConversationData, generateTalkLogSummary, generateChitchatData, generateGossipData, generateGossipLogSummary } from './logic/conversationGenerator';
import type { GossipReveal } from './logic/conversationGenerator';
import { electActivists, processOneActivist } from './logic/activistLogic';
import { ORGANIZATIONS } from './data/organizations';
import { getOrganizationVote } from './logic/organizationLogic';
import {
  initBattle, resolvePlayerTurn, resolveEnemyTurn,
  checkBattleEnd, applyWinShift, applyLoseShift, applyTimeoutShift,
  getPlayerFaction, getAttitudeCost, shouldPass, checkIsInLove
} from './battleLogic';
import { TitleScreen } from './screens/titleScreen';
import { FactionSelectScreen } from './screens/factionSelect';
import { CharacterSelectScreen } from './screens/characterSelect';
import { DailyScreen } from './screens/dailyScreen';
import { BattleScreen } from './screens/battleScreen';
import { EndingScreen } from './screens/endingScreen';
import { DebugScreen } from './screens/debugScreen';
import { PrologueScreen } from './screens/prologueScreen';
import { PersuadeTutorial } from './screens/persuadeTutorial';
import { showInfoDialog, showConfirmDialog } from './ui/gameDialog';
import { bgm, BGM_TRACKS } from './bgm';
import { se } from './se';
import { saveGame, loadGame, deleteSaveData } from './saveLoad';
import * as analytics from './analytics';

function createInitialState(): GameState {
  return {
    screen: 'title',
    faction: null,
    students: STUDENTS.map(s => ({
      ...s,
      revealedHobbies: new Set<HobbyTopic>(),
      revealedLikes: [] as import('./types').PreferenceAttr[],
      revealedDislikes: [] as import('./types').PreferenceAttr[],
    })),
    day: 1,
    currentTime: 0,
    stamina: 100,
    currentLocation: 'class1b',
    timeSlot: 'afterschool',
    battle: null,
    lastBattleResult: null,
    playerCharacter: null,
    playerAttributes: [],
    playerSupport: { conservative: 0, progressive: 0, sports: 0 },
    organizations: ORGANIZATIONS,
    actionLogs: [],
    activists: [],
    lostItem: null,
    errand: null,
    tutorial: {
      seenPrologue: false,
      seenMove: false,
      seenTalk: false,
    },
  };
}

export class Game {
  private root: HTMLElement;
  private state: GameState;

  private titleScreen: TitleScreen | null = null;
  private factionSelectScreen: FactionSelectScreen | null = null;
  private characterScreen: CharacterSelectScreen | null = null;
  private dailyScreen: DailyScreen | null = null;
  private battleScreenInst: BattleScreen | null = null;
  private endingScreen: EndingScreen | null = null;
  private debugScreen: DebugScreen | null = null;
  private prologueScreen: PrologueScreen | null = null;
  private persuadeTutorial: PersuadeTutorial | null = null;
  private previousScreen: GameState['screen'] | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = createInitialState();
    this.setupDebugKey();
    this.showTitle();
  }

  /** 状態を部分更新し、現在の画面に反映する */
  private updateState(patch: Partial<GameState>): void {
    this.state = { ...this.state, ...patch };
  }

  private setupDebugKey(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        this.toggleDebug();
      }
    });
  }

  private toggleDebug(): void {
    if (this.debugScreen) {
      this.debugScreen.unmount();
      this.debugScreen = null;
      // 元の画面に戻る
      if (this.previousScreen === 'daily') {
        this.showDaily();
      }
      this.previousScreen = null;
    } else {
      // 派閥選択後のみデバッグ表示可能
      if (!this.state.faction) return;
      this.previousScreen = this.state.screen;
      this.clearScreens();
      this.debugScreen = new DebugScreen(this.state, {
        onClose: () => this.toggleDebug(),
      });
      this.debugScreen.mount(this.root);
    }
  }

  private clearScreens(): void {
    this.titleScreen?.unmount();
    this.prologueScreen?.unmount();
    this.factionSelectScreen?.unmount();
    this.characterScreen?.unmount();
    this.dailyScreen?.unmount();
    this.battleScreenInst?.unmount();
    this.endingScreen?.unmount();
    this.debugScreen?.unmount();
    this.titleScreen = null;
    this.prologueScreen = null;
    this.factionSelectScreen = null;
    this.characterScreen = null;
    this.dailyScreen = null;
    this.battleScreenInst = null;
    this.endingScreen = null;
    this.debugScreen = null;
  }

  private showTitle(): void {
    this.clearScreens();
    bgm.play(BGM_TRACKS.title);
    this.titleScreen = new TitleScreen({
      onStart: () => {
        deleteSaveData();
        analytics.trackGameStart();
        this.showPrologue();
      },
      onContinue: () => this.continueGame(),
      onPersuadeTutorial: () => this.showPersuadeTutorial('title'),
    });
    this.titleScreen.mount(this.root);
  }

  private continueGame(): void {
    const saved = loadGame();
    if (!saved) return;
    this.state = saved;
    this.state.screen = 'daily';
    this.showDaily();
  }

  private showPersuadeTutorial(returnTo: 'title' | 'daily'): void {
    showConfirmDialog(this.root, {
      title: '説得バトル チュートリアル',
      message: '渡辺あおいを相手に説得バトルを練習します。<br>2ラウンドで雑談→思想説得の流れを体験できます。',
      okLabel: 'はじめる',
      cancelLabel: 'やめる',
    }).then((ok) => {
      if (!ok) return;
      bgm.play(BGM_TRACKS.settoku);
      this.persuadeTutorial = new PersuadeTutorial({
        onFinish: () => {
          analytics.trackTutorialPersuade();
          this.persuadeTutorial?.unmount();
          this.persuadeTutorial = null;
          bgm.play(returnTo === 'title' ? BGM_TRACKS.title : BGM_TRACKS.schoolDaytime);
        },
      });
      this.persuadeTutorial.mount(this.root);
    });
  }

  private showPrologue(): void {
    this.clearScreens();
    this.updateState({ screen: 'prologue' });
    this.prologueScreen = new PrologueScreen({
      onFinish: () => {
        this.updateState({ tutorial: { ...this.state.tutorial, seenPrologue: true } });
        this.showFactionSelect();
      },
    });
    this.prologueScreen.mount(this.root);
  }

  private showFactionSelect(): void {
    this.clearScreens();
    this.updateState({ screen: 'faction_select' });
    this.factionSelectScreen = new FactionSelectScreen({
      onSelect: (faction) => {
        analytics.trackFactionSelect(faction);
        this.showCharacterSelect(faction);
      },
    });
    this.factionSelectScreen.mount(this.root);
  }

  private showCharacterSelect(faction: FactionId, startAt: 'first' | 'last' = 'first'): void {
    this.clearScreens();
    const allStudents = STUDENTS.map(s => ({
      ...s,
      revealedHobbies: new Set<HobbyTopic>(),
    }));
    const factionStudents = allStudents.filter(s => {
      const topFaction = ALL_FACTION_IDS
        .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
      return topFaction === faction && s.playable;
    });
    this.characterScreen = new CharacterSelectScreen(factionStudents, faction, {
      onSelect: (selected: Student) => {
        analytics.trackCharacterSelect(selected.name, faction);
        // 選んだ生徒をプレイヤーに（studentsには全員残す＝組織の代表計算に必要）
        const startLocation = CLASS_LOCATION_MAP[selected.className] ?? 'class1b';
        this.state = {
          ...createInitialState(),
          screen: 'daily',
          faction: faction,
          students: allStudents,
          currentLocation: startLocation,
          playerCharacter: {
            id: selected.id,
            name: selected.name,
            gender: selected.gender,
            className: selected.className,
            personality: selected.personality,
            hobbies: selected.hobbies,
            attributes: [...selected.attributes],
            likedAttributes: [...selected.likedAttributes],
            dislikedAttributes: [...selected.dislikedAttributes],
            stats: { ...selected.stats },
            portrait: selected.portrait,
          },
          playerAttributes: [...selected.attributes, selected.hairStyle],
          playerSupport: { ...selected.support },
        };
        // 初日の活動家選出
        this.updateState({
          activists: electActivists(this.state.students, selected.id, faction),
        });
        // 初日セーブ
        saveGame(this.state);
        this.showDaily();
      },
      onBack: () => {
        this.showFactionSelect();
      },
      onChangeFaction: (delta: -1 | 1, startAtParam: 'first' | 'last') => {
        const idx = ALL_FACTION_IDS.indexOf(faction);
        const nextFaction = ALL_FACTION_IDS[(idx + delta + ALL_FACTION_IDS.length) % ALL_FACTION_IDS.length];
        this.showCharacterSelect(nextFaction, startAtParam);
      },
    }, startAt);
    this.characterScreen.mount(this.root);
  }

  private showDaily(): void {
    this.clearScreens();
    bgm.play(BGM_TRACKS.schoolDaytime);
    this.updateState({ screen: 'daily' });
    this.dailyScreen = new DailyScreen(this.state, {
      onEnterRoom: (locationId: LocationId) => this.handleEnterRoom(locationId),
      onExitRoom: () => this.handleExitRoom(),
      onChangeFloor: (floor: Floor) => this.handleChangeFloor(floor),
      onTalk: (student: Student) => this.handleTalk(student),
      onGossip: (student: Student) => this.handleGossip(student),
      onPersuade: (student: Student) => this.handlePersuade(student),
      onNurseRest: () => this.handleNurseRest(),
      onClassroomRest: () => this.handleClassroomRest(),
      onRooftopRest: () => this.handleRooftopRest(),
      onTrain: (stat: 'speech' | 'athletic' | 'intel') => this.handleTrain(stat),
      onDeliverLostItem: () => this.handleDeliverLostItem(),
      onDeliverErrand: () => this.handleDeliverErrand(),
      onNextDay: () => this.handleNextDay(),
      onPersuadeTutorial: () => this.showPersuadeTutorial('daily'),
      onSave: () => {
        saveGame(this.state);
        analytics.trackSave(this.state.day);
        if (this.dailyScreen) {
          showInfoDialog(this.root, { title: 'セーブ', message: 'セーブしました。' });
        }
      },
      onLoad: () => {
        const saved = loadGame();
        if (saved) {
          this.state = saved;
          analytics.trackLoad(this.state.day);
          this.state.screen = 'daily';
          this.showDaily();
        }
      },
    });
    this.dailyScreen.mount(this.root);

    // チュートリアル: 初日にゲームの目的＋移動ヒント
    if (!this.state.tutorial.seenMove && this.state.day === 1) {
      this.updateState({ tutorial: { ...this.state.tutorial, seenMove: true } });
      const fLabel = FACTION_LABELS[this.state.faction ?? 'conservative'] ?? '';
      const fColor = FACTION_INFO.find(f => f.id === this.state.faction)?.color ?? '#888';
      showInfoDialog(this.root, {
        title: 'ゲームの目的',
        message:
          `学園祭の企画投票で<strong style="color:${fColor};">${fLabel}派</strong>を勝利させよう！<br><br>` +
          '<strong>30日間</strong>で生徒たちを説得し、クラスや部活の支持を集める。<br>' +
          '投票日に<strong>過半数の組織</strong>を支持させれば勝利！<br><br>' +
          'まずは学園を探索してみよう。<br>廊下のマップから教室や部室に移動できるよ。',
      });
      analytics.trackTutorialMove();
      saveGame(this.state);
    }
  }

  private isTimeUp(): boolean {
    return this.state.currentTime >= MAX_TIME;
  }

  private handleEnterRoom(locationId: LocationId): void {
    if (this.state.stamina < MOVE_COST.ENTER_ROOM || this.isTimeUp()) return;
    this.updateState({
      currentLocation: locationId,
      stamina: this.state.stamina - MOVE_COST.ENTER_ROOM,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.ENTER_ROOM),
    });
    this.dailyScreen?.update(this.state);

    // チュートリアル: 初めて部屋に入った時
    if (!this.state.tutorial.seenTalk) {
      this.updateState({ tutorial: { ...this.state.tutorial, seenTalk: true } });
      showInfoDialog(this.root, {
        title: 'ヒント',
        message: '生徒に話しかけてみよう。<br>雑談で趣味や好みを知ることができる。<br>仲良くなると説得が有利になるかも？',
      });
      analytics.trackTutorialTalk();
      saveGame(this.state);
    }

    if (this.tryLostItem()) return;
    if (!this.tryActivistAction()) this.tryChitchat();
  }

  private handleExitRoom(): void {
    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    this.updateState({
      currentLocation: getCorridorForFloor(currentFloor),
    });
    this.dailyScreen?.update(this.state);
  }

  private handleChangeFloor(targetFloor: Floor): void {
    if (this.isTimeUp()) return;
    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    if (!FLOOR_ADJACENCY[currentFloor].includes(targetFloor)) return;
    const cost = getFloorMoveCost(currentFloor, targetFloor);
    if (this.state.stamina < cost) return;
    const timeCost = (currentFloor === '1f' && targetFloor === 'ground') ? TIME_COST.GO_OUTSIDE
      : (currentFloor === 'ground' && targetFloor === '1f') ? TIME_COST.GO_INSIDE
      : TIME_COST.CHANGE_FLOOR;
    this.updateState({
      currentLocation: getCorridorForFloor(targetFloor),
      stamina: this.state.stamina - cost,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + timeCost),
    });
    this.dailyScreen?.update(this.state);
    if (!this.tryActivistAction()) this.tryChitchat();
  }

  /** 移動後に活動家の行動を1人分処理する。イベント発生時はtrueを返す */
  private tryActivistAction(): boolean {
    const pc = this.state.playerCharacter;
    if (!pc || this.state.activists.length === 0) return false;

    // ランダムに1人の活動家を選ぶ
    const activistId = this.state.activists[Math.floor(Math.random() * this.state.activists.length)];

    const result = processOneActivist(
      activistId,
      this.state.students,
      this.state.activists,
      pc.id,
    );

    // NPC同士の説得結果を反映
    if (result.log) {
      this.updateState({
        students: result.updatedStudents,
        actionLogs: [...this.state.actionLogs, result.log],
      });
      this.dailyScreen?.update(this.state);
    }

    // プレイヤーがターゲットにされた場合 → 呼び止め会話 → バトル
    if (result.playerTargetedBy) {
      const activist = result.playerTargetedBy;
      const faction = result.playerTargetedFaction!;
      this.showActivistApproach(activist, faction);
      return true;
    }

    return false;
  }

  /** 活動家がプレイヤーに近づいてくる演出（会話→バトル） */
  private showActivistApproach(activist: Student, faction: FactionId): void {
    const pc = this.state.playerCharacter;
    if (!pc) return;

    const factionLabel = FACTION_LABELS[faction];
    const openerLines: Record<string, string[]> = {
      passionate: ['おい、ちょっと待てよ！話があるんだ！', 'よう！逃がさないぜ、聞いてくれ！'],
      cautious: ['すみません…少しお時間いただけますか？大事な話があって。', 'あの…どうしても伝えたいことがあるんです。'],
      stubborn: ['……止まれ。話がある。', '少し付き合え。大事な話だ。'],
      flexible: ['ねぇねぇ、ちょっといい？聞いてほしいことがあってさ！', 'あっ、ちょうどよかった！ちょっと話聞いてくれない？'],
      cunning: ['やあ、偶然だね…いや、実は待ってたんだ。', 'ふふ、見つけた。少し話をしようじゃないか。'],
    };
    const lines = openerLines[activist.personality] ?? openerLines['flexible'];
    const text = lines[Math.floor(Math.random() * lines.length)];

    const steps = [
      {
        speaker: 'student' as const,
        name: activist.name,
        portrait: activist.portrait,
        text: `「${text}」`,
      },
      {
        speaker: 'student' as const,
        name: activist.name,
        portrait: activist.portrait,
        text: `「${factionLabel}派の良さをわかってもらいたいんだ！」`,
      },
    ];
    const result = {
      text: `${activist.name}（${factionLabel}派）が説得を仕掛けてきた！`,
      effectHtml: '<span style="color:#E74C3C; font-weight:bold;">説得バトル開始！</span>',
    };

    this.dailyScreen?.showConversation(steps, result, () => {
      this.startActivistBattle(activist, faction);
    });
  }

  /** 移動後に一定確率で雑談イベントを発生させる */
  private tryChitchat(): void {
    if (Math.random() > 0.25) return; // 25%の確率

    const pc = this.state.playerCharacter;
    if (!pc) return;

    // 現在地にいる生徒（プレイヤー自身を除く）
    const studentsHere = this.state.students.filter(s =>
      s.id !== pc.id &&
      getStudentLocation(s.id, this.state.timeSlot, this.state.day, this.state.currentTime) === this.state.currentLocation
    );
    if (studentsHere.length === 0) return;

    const student = studentsHere[Math.floor(Math.random() * studentsHere.length)];

    // 未判明の趣味があれば1つ判明させる
    const unrevealed = (Object.keys(student.hobbies) as HobbyTopic[]).filter(
      h => !student.revealedHobbies.has(h)
    );
    let revealedHobby: HobbyTopic | null = null;
    const newRevealed = new Set(student.revealedHobbies);
    if (unrevealed.length > 0) {
      revealedHobby = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      newRevealed.add(revealedHobby);
    }

    const chitchatIsInLove = checkIsInLove(student, pc.gender, this.state.playerAttributes);
    const convData = generateChitchatData(
      student,
      pc.name,
      pc.portrait ?? null,
      pc.personality,
      pc.gender,
      revealedHobby,
      chitchatIsInLove,
    );

    // 好感度を微量上昇
    const affinityGain = convData.result.affinityGain ?? 1;
    const updatedStudents = this.state.students.map(s =>
      s.id === student.id
        ? { ...s, affinity: Math.min(100, s.affinity + affinityGain), revealedHobbies: newRevealed }
        : s
    );
    this.updateState({ students: updatedStudents });

    this.dailyScreen?.showConversation(convData.steps, convData.result, () => {
      this.updateState({
        actionLogs: [...this.state.actionLogs, `${student.name}が話しかけてきた。 <span style="color:#7EC850;">好感度+${affinityGain}</span>`],
      });
      this.dailyScreen?.update(this.state);
    });
  }

  /** 落とし物イベント（部屋に入った時 15% で発生） */
  private tryLostItem(): boolean {
    if (this.state.lostItem) return false; // 既に所持中
    if (Math.random() > 0.15) return false;

    const pc = this.state.playerCharacter;
    if (!pc) return false;

    // 持ち主候補: プレイヤー以外の一般生徒
    const candidates = this.state.students.filter(s => s.id !== pc.id);
    if (candidates.length === 0) return false;

    const owner = candidates[Math.floor(Math.random() * candidates.length)];

    const items: { name: string; hint: (s: Student) => string }[] = [
      { name: '手帳', hint: (s) => `${s.name}と名前が書いてある` },
      { name: 'ハンカチ', hint: (s) => `「${s.name.charAt(0)}」のイニシャル入り` },
      { name: 'お守り', hint: (s) => s.clubId ? `${CLUB_LABELS[s.clubId] ?? s.clubId}のマークが付いている` : `${s.className}のシールが貼ってある` },
      { name: 'ペンケース', hint: (s) => `${s.className}のシールが貼ってある` },
    ];
    const item = items[Math.floor(Math.random() * items.length)];

    this.updateState({
      lostItem: { itemName: item.name, hint: item.hint(owner), ownerId: owner.id },
    });
    this.dailyScreen?.update(this.state);
    this.dailyScreen?.showLostItemFound(item.name, item.hint(owner), (picked) => {
      if (!picked) {
        this.updateState({ lostItem: null });
        this.dailyScreen?.update(this.state);
      }
    });
    return true;
  }

  /** 落とし物を届ける */
  private handleDeliverLostItem(): void {
    const li = this.state.lostItem;
    if (!li) return;

    const owner = this.state.students.find(s => s.id === li.ownerId);
    if (!owner) return;

    const pc = this.state.playerCharacter;
    const AFFINITY_GAIN = 15;

    const steps: import('./logic/conversationGenerator').ConversationStep[] = [
      { speaker: 'player', name: pc?.name ?? 'あなた', portrait: pc?.portrait ?? null, text: `「これ、${owner.nickname}の${li.itemName}じゃない？」` },
      { speaker: 'student', name: owner.name, portrait: owner.portrait, text: `「あっ、探してたの！ わざわざありがとう！」` },
    ];
    const result: import('./logic/conversationGenerator').ConversationResult = {
      text: `${owner.name}に${li.itemName}を届けた。`,
      effectHtml: `<span style="color:#7EC850;">${owner.name}の好感度+${AFFINITY_GAIN}</span>`,
    };

    this.updateState({
      students: this.state.students.map(s =>
        s.id === li.ownerId ? { ...s, affinity: Math.min(100, s.affinity + AFFINITY_GAIN) } : s
      ),
      lostItem: null,
      actionLogs: [...this.state.actionLogs, `${owner.name}に${li.itemName}を届けた。<span style="color:#7EC850;">好感度+${AFFINITY_GAIN}</span>`],
    });
    this.dailyScreen?.update(this.state);
    this.dailyScreen?.showConversation(steps, result, () => {});
  }

  /** おつかいを届ける */
  private handleDeliverErrand(): void {
    const er = this.state.errand;
    if (!er) return;

    const from = this.state.students.find(s => s.id === er.fromId);
    const to = this.state.students.find(s => s.id === er.toId);
    if (!from || !to) return;

    const pc = this.state.playerCharacter;
    const AFFINITY_GAIN = 8;

    const steps: import('./logic/conversationGenerator').ConversationStep[] = [
      { speaker: 'player', name: pc?.name ?? 'あなた', portrait: pc?.portrait ?? null, text: `「${from.nickname}から${er.itemName}を預かってきたよ」` },
      { speaker: 'student', name: to.name, portrait: to.portrait, text: `「わざわざ届けてくれたの？ ありがとう！」` },
      { speaker: 'student', name: to.name, portrait: to.portrait, text: `「${from.nickname}にもお礼言っておくね」` },
    ];
    const result: import('./logic/conversationGenerator').ConversationResult = {
      text: `${from.name}の${er.itemName}を${to.name}に届けた。`,
      effectHtml: `<span style="color:#7EC850;">${from.name}の好感度+${AFFINITY_GAIN}</span><br><span style="color:#7EC850;">${to.name}の好感度+${AFFINITY_GAIN}</span>`,
    };

    this.updateState({
      students: this.state.students.map(s => {
        if (s.id === er.fromId || s.id === er.toId) {
          return { ...s, affinity: Math.min(100, s.affinity + AFFINITY_GAIN) };
        }
        return s;
      }),
      errand: null,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + 5),
      actionLogs: [...this.state.actionLogs, `${from.name}の${er.itemName}を${to.name}に届けた。<span style="color:#7EC850;">双方の好感度+${AFFINITY_GAIN}</span>`],
    });
    se.questComplete();
    this.dailyScreen?.update(this.state);
    this.dailyScreen?.showConversation(steps, result, () => {});
  }

  /** おつかいイベント発生（会話後 20%） */
  private tryErrand(student: Student): void {
    if (this.state.errand) return; // 既に受注中
    if (student.affinity < 15) return; // 「好意」以上で発生
    if (Math.random() > 0.20) return;

    const pc = this.state.playerCharacter;
    if (!pc) return;

    // 届け先: 同じクラスまたは同じ部活で、異なるフロアにいる生徒を優先
    const possibleTargets = this.state.students.filter(s =>
      s.id !== pc.id && s.id !== student.id &&
      (s.className === student.className || (s.clubId && s.clubId === student.clubId))
    );
    if (possibleTargets.length === 0) return;

    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    const diffFloor = possibleTargets.filter(s => {
      const loc = getStudentLocation(s.id, this.state.timeSlot, this.state.day, this.state.currentTime);
      if (!loc) return false;
      return getFloorFromLocation(loc) !== currentFloor;
    });
    const pool = diffFloor.length > 0 ? diffFloor : possibleTargets;
    const target = pool[Math.floor(Math.random() * pool.length)];

    const errandItems = ['手紙', 'ノート', '文房具セット', '伝言'];
    const itemName = errandItems[Math.floor(Math.random() * errandItems.length)];

    // おつかい依頼の会話を表示してから確認ダイアログ
    const errandLines: { text: string; item: string }[] = [
      { text: `「ねぇ、${target.nickname}に${itemName}を届けてくれない？」`, item: '手紙' },
      { text: `「${target.nickname}に${itemName}を返しておいてほしいんだけど…」`, item: 'ノート' },
      { text: `「${target.nickname}の${itemName}、預かってるんだけど届けてくれる？」`, item: '文房具セット' },
      { text: `「${target.nickname}に伝えてほしいことがあるんだけど…」`, item: '伝言' },
    ];
    const line = errandLines.find(l => l.item === itemName) ?? errandLines[0];
    const steps: import('./logic/conversationGenerator').ConversationStep[] = [
      { speaker: 'student', name: student.name, portrait: student.portrait, text: line.text },
      { speaker: 'student', name: student.name, portrait: student.portrait, text: `「${target.nickname}、今どこにいるかわかんないんだよね。お願いできる？」` },
      { speaker: 'player', name: pc?.name ?? 'あなた', portrait: pc?.portrait ?? null, text: '「わかった、届けておくよ。」' },
    ];
    const result: import('./logic/conversationGenerator').ConversationResult = {
      text: `${student.name}から${target.name}への${itemName}を預かった`,
      effectHtml: `<span style="color:#4A90D9;">📨 ${target.name}に${itemName}を届ける</span>`,
    };
    this.dailyScreen?.showConversation(steps, result, () => {
      se.questAccept();
      this.updateState({
        errand: { fromId: student.id, toId: target.id, itemName },
        actionLogs: [...this.state.actionLogs, `${student.name}から${target.name}への${itemName}を預かった。`],
      });
      this.dailyScreen?.update(this.state);
    });
  }

  private handleTalk(student: Student): void {
    if (this.state.stamina < 5 || this.isTimeUp()) return;
    se.talkStart();

    // 趣味を解禁（会話するたびにランダムで1つ）
    const unrevealed = Object.keys(student.hobbies).filter(
      h => !student.revealedHobbies.has(h as HobbyTopic)
    ) as HobbyTopic[];

    let revealedHobby: HobbyTopic | null = null;
    const affinityGain = this.calcAffinityGain(student);

    const updatedStudents = this.state.students.map(s => {
      if (s.id !== student.id) return s;
      const newRevealed = new Set(s.revealedHobbies);
      if (unrevealed.length > 0) {
        revealedHobby = unrevealed[Math.floor(Math.random() * unrevealed.length)];
        newRevealed.add(revealedHobby);
      }
      return {
        ...s,
        revealedHobbies: newRevealed,
        affinity: Math.max(-100, Math.min(100, s.affinity + affinityGain)),
      };
    });

    // 状態更新（会話演出前にデータだけ反映）
    this.updateState({
      students: updatedStudents,
      stamina: this.state.stamina - 5,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.TALK),
    });
    this.dailyScreen?.update(this.state);

    // 会話ウィンドウ表示
    const pc = this.state.playerCharacter;
    const isInLove = checkIsInLove(student, pc?.gender, this.state.playerAttributes);
    const convData = generateConversationData(
      student,
      pc?.name ?? 'あなた',
      pc?.portrait ?? null,
      pc?.personality ?? 'flexible',
      pc?.gender ?? 'male',
      revealedHobby,
      affinityGain,
      isInLove,
    );
    this.dailyScreen?.showConversation(convData.steps, convData.result, () => {
      // 会話終了: 要約ログを追加
      const logSummary = generateTalkLogSummary(student, revealedHobby, affinityGain);
      this.updateState({
        actionLogs: [...this.state.actionLogs, logSummary],
      });
      this.dailyScreen?.update(this.state);
      // おつかいイベント発生判定
      const updatedStudent = this.state.students.find(s => s.id === student.id);
      if (updatedStudent) this.tryErrand(updatedStudent);
    });
  }

  private handleGossip(student: Student): void {
    if (this.state.stamina < 5 || this.isTimeUp()) return;

    // 「好意」未満では噂話を教えてもらえない
    if (student.affinity < 15) {
      const pc = this.state.playerCharacter;
      const refuseSteps: import('./logic/conversationGenerator').ConversationStep[] = [
        { speaker: 'player', name: pc?.name ?? 'あなた', portrait: pc?.portrait ?? null, text: '「周りの人について何か知ってる？」' },
        { speaker: 'student', name: student.name, portrait: student.portrait, text: '「うーん、特にないかなぁ…」' },
      ];
      const refuseResult: import('./logic/conversationGenerator').ConversationResult = {
        text: `${student.name}はあまり教えてくれなかった`,
        effectHtml: '<span style="color:#999;">情報なし</span>',
      };
      this.updateState({
        stamina: this.state.stamina - 5,
        currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.TALK),
        actionLogs: [...this.state.actionLogs, `${student.name}に噂話を聞いたが、教えてもらえなかった。`],
      });
      this.dailyScreen?.update(this.state);
      this.dailyScreen?.showConversation(refuseSteps, refuseResult, () => {});
      return;
    }

    // 会話相手と同じクラス・部活のメンバーを集める
    const sameOrgs = ORGANIZATIONS.filter(org => {
      const allIds = [org.leaderId, ...org.subLeaderIds, ...org.memberIds];
      return allIds.includes(student.id);
    });
    const relatedIds = new Set<string>();
    for (const org of sameOrgs) {
      for (const id of [org.leaderId, ...org.subLeaderIds, ...org.memberIds]) {
        if (id !== student.id) relatedIds.add(id);
      }
    }
    // プレイヤー自身は除外
    const playerId = this.state.playerCharacter?.id;
    if (playerId) relatedIds.delete(playerId);

    const relatedStudents = this.state.students.filter(s => relatedIds.has(s.id));
    if (relatedStudents.length === 0) return;

    // ランダムに噂の対象を選ぶ
    const target = relatedStudents[Math.floor(Math.random() * relatedStudents.length)];

    // 判明させる情報を選ぶ（3種のうちランダムに1つ）
    const reveal: GossipReveal = { targetId: target.id, targetName: target.name };

    const unrevealedHobbies = (Object.keys(target.hobbies) as HobbyTopic[])
      .filter(h => !target.revealedHobbies.has(h));
    const unrevealedLikes = target.likedAttributes.filter(a => !target.revealedLikes.includes(a));
    const unrevealedDislikes = target.dislikedAttributes.filter(a => !target.revealedDislikes.includes(a));

    // 候補をシャッフルして最初に当たったものを1つだけ採用
    const candidates: ('hobby' | 'like' | 'dislike')[] = [];
    if (unrevealedHobbies.length > 0) candidates.push('hobby');
    if (unrevealedLikes.length > 0) candidates.push('like');
    if (unrevealedDislikes.length > 0) candidates.push('dislike');

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (chosen === 'hobby') {
        const hobby = unrevealedHobbies[Math.floor(Math.random() * unrevealedHobbies.length)];
        reveal.hobby = { topic: hobby, pref: target.hobbies[hobby] };
      } else if (chosen === 'like') {
        reveal.likedAttr = unrevealedLikes[Math.floor(Math.random() * unrevealedLikes.length)];
      } else {
        reveal.dislikedAttr = unrevealedDislikes[Math.floor(Math.random() * unrevealedDislikes.length)];
      }
    }

    // 何も新情報がない場合
    if (!reveal.hobby && !reveal.likedAttr && !reveal.dislikedAttr) {
      // スタミナだけ消費して「もう知ってることばかりだった」
      const affinityGain = this.calcAffinityGain(student);
      const updatedStudents = this.state.students.map(s => {
        if (s.id !== student.id) return s;
        return { ...s, affinity: Math.max(-100, Math.min(100, s.affinity + affinityGain)) };
      });
      this.updateState({
        students: updatedStudents,
        stamina: this.state.stamina - 5,
        currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.TALK),
        actionLogs: [...this.state.actionLogs, `${student.name}に噂話を聞いたが、新しい情報はなかった。`],
      });
      this.dailyScreen?.update(this.state);
      return;
    }

    const affinityGain = this.calcAffinityGain(student);

    // 対象の生徒の情報を更新
    const updatedStudents = this.state.students.map(s => {
      if (s.id === student.id) {
        return { ...s, affinity: Math.max(-100, Math.min(100, s.affinity + affinityGain)) };
      }
      if (s.id === target.id) {
        const newRevealed = new Set(s.revealedHobbies);
        if (reveal.hobby) newRevealed.add(reveal.hobby.topic);
        const newLikes = [...s.revealedLikes];
        if (reveal.likedAttr && !newLikes.includes(reveal.likedAttr)) newLikes.push(reveal.likedAttr);
        const newDislikes = [...s.revealedDislikes];
        if (reveal.dislikedAttr && !newDislikes.includes(reveal.dislikedAttr)) newDislikes.push(reveal.dislikedAttr);
        return { ...s, revealedHobbies: newRevealed, revealedLikes: newLikes, revealedDislikes: newDislikes };
      }
      return s;
    });

    this.updateState({
      students: updatedStudents,
      stamina: this.state.stamina - 5,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.TALK),
    });
    this.dailyScreen?.update(this.state);

    // 会話ウィンドウ表示
    const pc = this.state.playerCharacter;
    const convData = generateGossipData(
      student,
      pc?.name ?? 'あなた',
      pc?.portrait ?? null,
      pc?.personality ?? 'flexible',
      pc?.gender ?? 'male',
      reveal,
      affinityGain,
    );
    this.dailyScreen?.showConversation(convData.steps, convData.result, () => {
      const logSummary = generateGossipLogSummary(student, reveal, affinityGain);
      this.updateState({
        actionLogs: [...this.state.actionLogs, logSummary],
      });
      this.dailyScreen?.update(this.state);
    });
  }

  // プレイヤーのsupportをstudents配列にも同期する（組織票計算に必要）
  private syncPlayerSupport(students: Student[]): Student[] {
    const playerId = this.state.playerCharacter?.id;
    if (!playerId) return students;
    return students.map(s =>
      s.id === playerId ? { ...s, support: { ...this.state.playerSupport } } : s
    );
  }

  private calcAffinityGain(student: Student): number {
    // 基礎値5に倍率を掛ける（相性が良ければ×3=15、悪ければ×0.4=2）
    const base = 5;
    let multiplier = 1.0;
    for (const attr of this.state.playerAttributes) {
      if (student.likedAttributes.includes(attr)) multiplier += 0.4;
      if (student.dislikedAttributes.includes(attr)) multiplier -= 0.2;
    }
    // 最低0.4倍（=2）、最大3.0倍（=15）
    multiplier = Math.max(0.4, Math.min(3.0, multiplier));
    return Math.round(base * multiplier);
  }

  private handlePersuade(student: Student): void {
    if (this.isTimeUp()) return;

    const playerGender = this.state.playerCharacter?.gender;
    const playerAttrs = this.state.playerAttributes;
    const battle = initBattle(student, false, playerGender, playerAttrs);
    this.updateState({
      screen: 'battle',
      battle,
    });
    this.showBattle();
  }

  private handleNurseRest(): void {
    if (this.isTimeUp()) return;
    if (this.state.currentLocation !== 'nurses_office') return;
    const recovery = 100 - this.state.stamina;
    this.updateState({
      stamina: 100,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.NURSE_REST),
      actionLogs: [...this.state.actionLogs, `保健室で1時間休憩した（体力全回復 +${recovery}）`],
    });
    se.rest();
    this.dailyScreen?.update(this.state);
  }

  private handleClassroomRest(): void {
    if (this.isTimeUp()) return;
    const playerClassLoc = this.getPlayerClassLocation();
    if (this.state.currentLocation !== playerClassLoc) return;
    const recovery = Math.min(40, 100 - this.state.stamina);
    this.updateState({
      stamina: Math.min(100, this.state.stamina + 40),
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.CLASSROOM_REST),
      actionLogs: [...this.state.actionLogs, `自分の教室で休憩した（体力+${recovery} / ${TIME_COST.CLASSROOM_REST}分）`],
    });
    se.rest();
    this.dailyScreen?.update(this.state);
  }

  private handleRooftopRest(): void {
    if (this.isTimeUp()) return;
    if (this.state.currentLocation !== 'rooftop') return;
    const recovery = Math.min(10, 100 - this.state.stamina);
    this.updateState({
      stamina: Math.min(100, this.state.stamina + 10),
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.ROOFTOP_REST),
      actionLogs: [...this.state.actionLogs, `屋上で一息ついた（体力+${recovery} / ${TIME_COST.ROOFTOP_REST}分）`],
    });
    se.rest();
    this.dailyScreen?.update(this.state);
  }

  private handleTrain(stat: 'speech' | 'athletic' | 'intel'): void {
    if (this.isTimeUp()) return;
    if (this.state.stamina < 10) return;
    if (!this.state.playerCharacter) return;

    const TRAIN_AMOUNT = Math.floor(Math.random() * 4); // 0〜3
    const statLabels: Record<string, string> = {
      speech: '弁舌', athletic: '運動', intel: '知力',
    };
    const statIcons: Record<string, string> = {
      speech: '🎙️', athletic: '🏃', intel: '📚',
    };
    const statColors: Record<string, string> = {
      speech: '#E07820', athletic: '#27AE60', intel: '#2E5FAC',
    };
    const locationLabels: Record<string, string> = {
      speech: '放送室で発声練習', athletic: 'グラウンドで運動', intel: '図書室で読書',
    };

    const oldValue = this.state.playerCharacter.stats[stat];
    const newStats = { ...this.state.playerCharacter.stats };
    newStats[stat] = Math.min(100, newStats[stat] + TRAIN_AMOUNT);
    const newValue = newStats[stat];

    const playerId = this.state.playerCharacter.id;
    this.updateState({
      playerCharacter: {
        ...this.state.playerCharacter,
        stats: newStats,
      },
      students: this.state.students.map(s =>
        s.id === playerId ? { ...s, stats: newStats } : s
      ),
      stamina: this.state.stamina - 10,
      currentTime: Math.min(MAX_TIME, this.state.currentTime + TIME_COST.TRAINING),
      actionLogs: [...this.state.actionLogs, `${locationLabels[stat]}をした（${statLabels[stat]}${TRAIN_AMOUNT > 0 ? `+${TRAIN_AMOUNT}` : '変化なし'}）`],
    });
    this.dailyScreen?.update(this.state);
    this.dailyScreen?.showTrainingResult(
      statIcons[stat], statLabels[stat], oldValue, newValue, statColors[stat]
    );
  }

  private getPlayerClassLocation(): LocationId {
    const className = this.state.playerCharacter?.className ?? '1-B';
    return CLASS_LOCATION_MAP[className] ?? 'class1b';
  }

  private handleNextDay(): void {
    se.nextDay();
    analytics.trackDayAdvance(this.state.day + 1, this.state.faction ?? 'unknown');
    if (this.state.day >= 30) {
      this.showEnding();
      return;
    }
    const newDay = this.state.day + 1;

    // 活動家の再選出（毎日）
    const activists = electActivists(
      this.state.students,
      this.state.playerCharacter?.id ?? '',
      this.state.faction ?? 'conservative',
    );

    this.updateState({
      day: newDay,
      currentTime: 0,
      stamina: 100,
      currentLocation: this.getPlayerClassLocation(),
      timeSlot: 'afterschool',
      activists,
      actionLogs: [],
    });

    // オートセーブ
    saveGame(this.state);

    this.showDaily();
  }

  /** 活動家からの強制説得バトルを開始 */
  private startActivistBattle(activist: Student, _activistCandidate: FactionId): void {
    const playerGender = this.state.playerCharacter?.gender;
    const playerAttrs = this.state.playerAttributes;
    const battle = initBattle(activist, true, playerGender, playerAttrs); // isDefending = true
    this.updateState({
      battle,
      });
    this.showBattle();
  }

  private showBattle(): void {
    this.clearScreens();
    bgm.play(BGM_TRACKS.settoku);
    if (!this.state.battle) return;
    analytics.trackBattleStart(this.state.battle.student.name, this.state.battle.isDefending);

    this.battleScreenInst = new BattleScreen(this.state, {
      onAttitudeSelect: (attitude: PlayerAttitude) => {
        if (!this.state.battle) return;
        const cost = getAttitudeCost(attitude);
        if (this.state.stamina < cost) return;
        this.updateState({
          stamina: this.state.stamina - cost,
          battle: {
            ...this.state.battle,
            selectedAttitude: attitude,
            phase: 'select_topic',
          },
        });
        this.battleScreenInst?.update(this.state);
      },
      onTopicSelect: (topic: Topic) => {
        if (!this.state.battle) return;
        this.updateState({
          battle: {
            ...this.state.battle,
            selectedTopic: topic,
            phase: 'select_stance',
          },
        });
        this.battleScreenInst?.update(this.state);
      },
      onStanceSelect: (stance: Stance) => {
        if (!this.state.battle || !this.state.faction) return;
        const { selectedAttitude, selectedTopic } = this.state.battle;
        if (!selectedAttitude || !selectedTopic) return;

        const playerLikedAttributes = this.state.playerCharacter?.likedAttributes ?? [];
        const playerStats = this.state.playerCharacter?.stats ?? { speech: 50, athletic: 50, intel: 50, maxHp: 100 };
        const playerGender = this.state.playerCharacter?.gender ?? 'male';

        // プレイヤーターン
        const { newBattle: afterPlayer } = resolvePlayerTurn(
          this.state.battle, selectedAttitude, selectedTopic, stance, this.state.faction,
          playerLikedAttributes, playerStats, playerGender
        );

        const checkedAfterPlayer = checkBattleEnd(afterPlayer);
        const playerBarDelta = afterPlayer.barPosition - (this.state.battle?.barPosition ?? 0);
        if (playerBarDelta > 0) se.barPositive(playerBarDelta);
        else if (playerBarDelta < 0) se.barNegative(playerBarDelta);

        if (checkedAfterPlayer.phase === 'finished') {
          this.updateState({ battle: checkedAfterPlayer });
          this.battleScreenInst?.update(this.state);
          return;
        }

        // 相手ターン
        this.updateState({ battle: { ...checkedAfterPlayer, phase: 'resolving' } });
        this.battleScreenInst?.update(this.state);

        setTimeout(() => {
          if (!this.state.battle) return;
          const prevBar = this.state.battle.barPosition;
          const { newBattle: afterEnemy } = resolveEnemyTurn(this.state.battle);
          const enemyBarDelta = afterEnemy.barPosition - prevBar;
          if (enemyBarDelta < 0) se.barNegative(enemyBarDelta);
          else if (enemyBarDelta > 0) se.barPositive(enemyBarDelta);
          const finalBattle = checkBattleEnd(afterEnemy);
          this.updateState({ battle: finalBattle });
          this.battleScreenInst?.update(this.state);

          // 次のラウンドのパス判定
          if (finalBattle.phase === 'select_attitude') {
            setTimeout(() => this.checkPass(), 300);
          }
        }, 700);
      },
      onCancel: (phase: 'select_topic' | 'select_stance') => {
        if (!this.state.battle) return;
        se.cancel();
        if (phase === 'select_topic') {
          // 態度選択に戻る（スタミナを返還）
          const refund = this.state.battle.selectedAttitude
            ? getAttitudeCost(this.state.battle.selectedAttitude) : 0;
          this.updateState({
            stamina: this.state.stamina + refund,
            battle: {
              ...this.state.battle,
              selectedAttitude: null,
              phase: 'select_attitude',
            },
          });
        } else if (phase === 'select_stance') {
          // 話題選択に戻る
          this.updateState({
            battle: {
              ...this.state.battle,
              selectedTopic: null,
              phase: 'select_topic',
            },
          });
        }
        this.battleScreenInst?.update(this.state);
      },
    });
    this.battleScreenInst.mount(this.root);

    // バトル終了イベントのリスナー
    this.root.addEventListener('battle-finish', () => {
      this.finishBattle();
    }, { once: true });

    // 初回のパス判定
    this.checkPass();
  }

  // 体力不足によるパス判定・実行
  private checkPass(): void {
    if (!this.state.battle || this.state.battle.phase !== 'select_attitude') return;
    if (!shouldPass(this.state.stamina)) return;

    se.pass();
    // パス: プレイヤーは行動できず、相手だけ反撃する（少し体力回復）
    const recovery = Math.floor(Math.random() * 3) + 3; // 3〜5回復
    const passFlavors = [
      '疲れで頭が回らない…言葉が出てこない。',
      '息が上がって、うまく話せない…。',
      '集中力が途切れ、相手の言葉を聞き流してしまう。',
      '頭がぼんやりして、反論を組み立てられない。',
    ];
    const passText = passFlavors[Math.floor(Math.random() * passFlavors.length)]
      + ` <span style="color:#7EC850;">少し息を整えた（体力+${recovery}）</span>`;
    const passLog = { speaker: 'player' as const, text: passText, effect: 0 };
    this.updateState({
      stamina: Math.min(100, this.state.stamina + recovery),
      battle: {
        ...this.state.battle,
        logs: [...this.state.battle.logs, passLog],
        phase: 'resolving',
      },
    });
    this.battleScreenInst?.update(this.state);

    setTimeout(() => {
      if (!this.state.battle) return;
      const { newBattle: afterEnemy } = resolveEnemyTurn(this.state.battle);
      const finalBattle = checkBattleEnd(afterEnemy);
      this.updateState({ battle: finalBattle });
      this.battleScreenInst?.update(this.state);

      // 次のラウンドもパス判定
      if (finalBattle.phase === 'select_attitude') {
        setTimeout(() => this.checkPass(), 300);
      }
    }, 700);
  }

  private finishBattle(): void {
    const battle = this.state.battle;
    if (!battle || !this.state.faction) return;

    const result = battle.result;
    const student = battle.student;
    analytics.trackBattleEnd(result ?? 'unknown', student.name, battle.isDefending);
    let shiftAmount = 0;

    // シフト結果を自然な日本語で表現するヘルパー
    const describeShift = (candidateId: FactionId, amount: number): string => {
      const name = FACTION_LABELS[candidateId] ?? candidateId;
      if (amount >= 50) return `${name}派が大きく強まった`;
      if (amount >= 20) return `${name}派が強まった`;
      return `${name}派が少し強まった`;
    };

    // 組織の支持変化検出用に変更前の生徒リストを保存
    const oldStudents = this.state.students;

    // 説得バトルの時間消費（防御バトルは時間消費なし）
    const timeAfterBattle = battle.isDefending
      ? this.state.currentTime
      : Math.min(MAX_TIME, this.state.currentTime + TIME_COST.PERSUADE);

    if (result === 'win') {
      se.victory();
      // 成功: 相手の思想をプレイヤーの支持方向にシフト
      const newSupport = applyWinShift(student, this.state.faction, battle.barPosition);
      shiftAmount = Math.abs(battle.barPosition);
      const updatedStudents = this.state.students.map(s => {
        if (s.id !== student.id) return s;
        return { ...s, support: newSupport };
      });

      // 成功時: プレイヤー自身の支持候補の思想も少し強化
      const playerSup = { ...this.state.playerSupport };
      const boostAmount = 3;
      const candidate = this.state.faction;
      const otherKeys = ALL_FACTION_IDS.filter(k => k !== candidate);
      playerSup[candidate] += boostAmount;
      for (const key of otherKeys) {
        playerSup[key] = Math.max(0, playerSup[key] - boostAmount / 2);
      }
      // 合計を100に正規化
      const pTotal = playerSup.conservative + playerSup.progressive + playerSup.sports;
      if (pTotal > 0) {
        for (const key of ALL_FACTION_IDS) {
          playerSup[key] = Math.round(playerSup[key] / pTotal * 100);
        }
      }

      const logEntry = battle.isDefending
        ? `【防衛成功】${student.name}の説得を跳ね返した！（${describeShift(this.state.faction, shiftAmount)}）`
        : `【説得成功】${student.name}を説得した！（${describeShift(this.state.faction, shiftAmount)}）`;
      this.updateState({
        screen: 'daily',
        students: updatedStudents,
        playerSupport: playerSup,
        battle: null,
        lastBattleResult: { student, win: true, shiftAmount },
        currentTime: timeAfterBattle,
        actionLogs: [...this.state.actionLogs, logEntry],
      });
      this.updateState({ students: this.syncPlayerSupport(this.state.students) });
      this.appendOrgChangeLogsAndProceed(oldStudents);
    } else if (result === 'lose') {
      se.defeat();
      // 失敗: プレイヤーの思想が相手方向にシフト
      const { newSupport, shiftPercent } = applyLoseShift(
        this.state.playerSupport, student.support, battle.barPosition
      );
      shiftAmount = shiftPercent;
      const enemyFaction = ALL_FACTION_IDS
        .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);
      const logEntry = battle.isDefending
        ? `【防衛失敗】${student.name}に押されてしまった…（${describeShift(enemyFaction, shiftAmount)}）`
        : `【説得失敗】${student.name}に説得されてしまった…（${describeShift(enemyFaction, shiftAmount)}）`;

      // プレイヤーの支持候補が変わったかチェック
      const newCandidate = getPlayerFaction(newSupport);
      if (newCandidate !== this.state.faction) {
        this.updateState({
          screen: 'gameover',
          playerSupport: newSupport,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          currentTime: timeAfterBattle,
          actionLogs: [...this.state.actionLogs, logEntry],
        });
        this.updateState({ students: this.syncPlayerSupport(this.state.students) });
        this.showGameOver();
      } else {
        this.updateState({
          screen: 'daily',
          playerSupport: newSupport,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          currentTime: timeAfterBattle,
          actionLogs: [...this.state.actionLogs, logEntry],
        });
        this.updateState({ students: this.syncPlayerSupport(this.state.students) });
        this.appendOrgChangeLogsAndProceed(oldStudents);
      }
    } else if (result === 'timeout') {
      se.timeout();
      // タイムアウト: バー位置に応じて双方の思想をシフト
      const { studentSupport, playerNewSupport, shiftPercent } = applyTimeoutShift(
        student, this.state.faction, this.state.playerSupport, battle.barPosition
      );
      shiftAmount = shiftPercent;
      const timeoutLabel = battle.barPosition > 0 ? '時間切れ（やや優勢）' : battle.barPosition < 0 ? '時間切れ（やや劣勢）' : '時間切れ（引き分け）';
      const timeoutFaction = battle.barPosition >= 0 ? this.state.faction
        : ALL_FACTION_IDS
            .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);
      const logEntry = `【${timeoutLabel}】${student.name}との説得（${describeShift(timeoutFaction, shiftAmount)}）`;

      const updatedStudents = this.state.students.map(s => {
        if (s.id !== student.id) return s;
        return { ...s, support: studentSupport };
      });

      // プレイヤーの支持候補が変わったかチェック
      const newCandidate = getPlayerFaction(playerNewSupport);
      if (newCandidate !== this.state.faction) {
        this.updateState({
          screen: 'gameover',
          playerSupport: playerNewSupport,
          students: updatedStudents,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          currentTime: timeAfterBattle,
          actionLogs: [...this.state.actionLogs, logEntry],
        });
        this.updateState({ students: this.syncPlayerSupport(this.state.students) });
        this.showGameOver();
      } else {
        this.updateState({
          screen: 'daily',
          playerSupport: playerNewSupport,
          students: updatedStudents,
          battle: null,
          lastBattleResult: { student, win: battle.barPosition > 0, shiftAmount },
          currentTime: timeAfterBattle,
          actionLogs: [...this.state.actionLogs, logEntry],
        });
        this.updateState({ students: this.syncPlayerSupport(this.state.students) });
        this.appendOrgChangeLogsAndProceed(oldStudents);
      }
    }
  }

  /** 組織の支持変化をログに追加し、ダイアログ表示→統一チェック→画面遷移 */
  private appendOrgChangeLogsAndProceed(oldStudents: Student[]): void {
    const orgChanges = this.detectOrgVoteChanges(oldStudents, this.state.students);
    if (orgChanges.length > 0) {
      this.updateState({ actionLogs: [...this.state.actionLogs, ...orgChanges] });
      // 変化をダイアログで順次表示してから遷移
      this.showOrgChangeDialogs(orgChanges, 0);
    } else if (this.isAllOrganizationsUnified()) {
      this.showEnding();
    } else {
      this.showDaily();
    }
  }

  /** 組織変化ダイアログを順次表示 */
  private showOrgChangeDialogs(messages: string[], index: number): void {
    if (index >= messages.length) {
      if (this.isAllOrganizationsUnified()) {
        this.showEnding();
      } else {
        this.showDaily();
      }
      return;
    }
    // HTMLタグを除去してプレーンテキストにする
    const plain = messages[index].replace(/<[^>]*>/g, '').replace(/📢\s*/, '');
    showInfoDialog(this.root, {
      title: '支持変動',
      message: plain,
    }).then(() => {
      this.showOrgChangeDialogs(messages, index + 1);
    });
  }

  private showGameOver(): void {
    this.clearScreens();
    analytics.trackGameOver(this.state.faction ?? 'unknown', this.state.day);
    deleteSaveData();
    this.endingScreen = new EndingScreen(this.state, {
      onRestart: () => {
        this.state = createInitialState();
        this.showTitle();
      },
    });
    this.endingScreen.mount(this.root);
  }

  /** 組織の支持変化を検出してログメッセージを返す */
  private detectOrgVoteChanges(
    oldStudents: Student[],
    newStudents: Student[]
  ): string[] {
    const messages: string[] = [];
    for (const org of ORGANIZATIONS) {
      const oldVote = getOrganizationVote(org, oldStudents);
      const newVote = getOrganizationVote(org, newStudents);
      if (oldVote !== newVote) {
        messages.push(
          `📢 ${org.name}の支持が${FACTION_LABELS[oldVote] ?? oldVote}派→${FACTION_LABELS[newVote] ?? newVote}派に変わった！`
        );
      }
    }
    return messages;
  }

  /** すべての組織が同一候補を支持しているかチェック */
  private isAllOrganizationsUnified(): boolean {
    if (ORGANIZATIONS.length === 0) return false;
    const first = getOrganizationVote(ORGANIZATIONS[0], this.state.students);
    return ORGANIZATIONS.every(org => getOrganizationVote(org, this.state.students) === first);
  }

  private showEnding(): void {
    // 全組織統一時は中間メッセージを表示してから結果画面へ
    if (this.state.day < 30 && this.isAllOrganizationsUnified()) {
      showInfoDialog(this.root, {
        title: '思想統一',
        message: `全組織の思想が統一された！<br>${this.state.day}日目──学園の意思がひとつにまとまった`,
        okLabel: '結果を見る',
      }).then(() => {
        this.transitionToEnding();
      });
    } else {
      this.transitionToEnding();
    }
  }

  private transitionToEnding(): void {
    this.clearScreens();
    const isUnified = this.state.day < 30 && this.isAllOrganizationsUnified();
    analytics.trackGameClear(this.state.faction ?? 'unknown', this.state.day, isUnified ? 'unified' : 'vote_win');
    deleteSaveData();
    this.updateState({ screen: 'ending' });
    this.endingScreen = new EndingScreen(this.state, {
      onRestart: () => {
        this.state = createInitialState();
        this.showTitle();
      },
    });
    this.endingScreen.mount(this.root);
  }
}

