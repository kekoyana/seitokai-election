import type {
  GameState, Student, CandidateId, LocationId, Floor,
  PlayerAttitude, Topic, Stance, HobbyTopic
} from './types';
import {
  STUDENTS, getFloorFromLocation, isCorridorLocation, getCorridorForFloor,
  FLOOR_ADJACENCY, MOVE_COST, getFloorMoveCost, HOBBY_LABELS
} from './data';
import { ORGANIZATIONS } from './data/organizations';
import { getOrganizationVote } from './logic/organizationLogic';
import {
  initBattle, resolvePlayerTurn, resolveEnemyTurn,
  checkBattleEnd, applyWinShift, applyLoseShift, applyTimeoutShift,
  getPlayerCandidate, getAttitudeCost, shouldPass
} from './battleLogic';
import { TitleScreen } from './screens/titleScreen';
import { CharacterSelectScreen } from './screens/characterSelect';
import { DailyScreen } from './screens/dailyScreen';
import { BattleScreen } from './screens/battleScreen';
import { EndingScreen } from './screens/endingScreen';
import { DebugScreen } from './screens/debugScreen';
import { bgm, BGM_TRACKS } from './bgm';

function createInitialState(): GameState {
  return {
    screen: 'title',
    candidate: null,
    students: STUDENTS.map(s => ({
      ...s,
      revealedHobbies: new Set<HobbyTopic>(),
    })),
    day: 1,
    stamina: 100,
    currentLocation: 'class1b',
    timeSlot: 'morning',
    battle: null,
    lastBattleResult: null,
    playerCharacter: null,
    playerAttributes: [],
    playerSupport: { conservative: 0, progressive: 0, sports: 0 },
    organizations: ORGANIZATIONS,
    actionLogs: [],
  };
}

export class Game {
  private root: HTMLElement;
  private state: GameState;

  private titleScreen: TitleScreen | null = null;
  private characterScreen: CharacterSelectScreen | null = null;
  private dailyScreen: DailyScreen | null = null;
  private battleScreenInst: BattleScreen | null = null;
  private endingScreen: EndingScreen | null = null;
  private debugScreen: DebugScreen | null = null;
  private previousScreen: GameState['screen'] | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.state = createInitialState();
    this.setupDebugKey();
    this.showTitle();
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
      // 候補者選択後のみデバッグ表示可能
      if (!this.state.candidate) return;
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
    this.characterScreen?.unmount();
    this.dailyScreen?.unmount();
    this.battleScreenInst?.unmount();
    this.endingScreen?.unmount();
    this.debugScreen?.unmount();
    this.titleScreen = null;
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
      onStart: () => this.showCharacterSelect(),
    });
    this.titleScreen.mount(this.root);
  }

  private showCharacterSelect(): void {
    this.clearScreens();
    const allStudents = STUDENTS.map(s => ({
      ...s,
      revealedHobbies: new Set<HobbyTopic>(),
    }));
    const playableStudents = allStudents.filter(s => s.playable);
    this.characterScreen = new CharacterSelectScreen(playableStudents, {
      onSelect: (selected: Student) => {
        // 選んだ生徒の思想軸の最大値が支持候補になる
        const candidateId = (['conservative', 'progressive', 'sports'] as CandidateId[])
          .reduce((a, b) => selected.support[a] >= selected.support[b] ? a : b);
        // 選んだ生徒をプレイヤーに（studentsには全員残す＝組織の代表計算に必要）
        const classMap: Record<string, LocationId> = {
          '1-A': 'class1a', '1-B': 'class1b', '1-C': 'class1c', '1-D': 'class1d',
          '2-A': 'class2a', '2-B': 'class2b', '2-C': 'class2c', '2-D': 'class2d',
          '3-A': 'class3a', '3-B': 'class3b', '3-C': 'class3c', '3-D': 'class3d',
        };
        const startLocation = classMap[selected.className] ?? 'class1b';
        this.state = {
          ...createInitialState(),
          screen: 'daily',
          candidate: candidateId,
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
          playerAttributes: [...selected.attributes],
          playerSupport: { ...selected.support },
        };
        this.showDaily();
      },
    });
    this.characterScreen.mount(this.root);
  }

  private showDaily(): void {
    this.clearScreens();
    bgm.play(BGM_TRACKS.schoolDaytime);
    this.state = { ...this.state, screen: 'daily' };
    this.dailyScreen = new DailyScreen(this.state, {
      onEnterRoom: (locationId: LocationId) => this.handleEnterRoom(locationId),
      onExitRoom: () => this.handleExitRoom(),
      onChangeFloor: (floor: Floor) => this.handleChangeFloor(floor),
      onTalk: (student: Student) => this.handleTalk(student),
      onPersuade: (student: Student) => this.handlePersuade(student),
      onNextDay: () => this.handleNextDay(),
    });
    this.dailyScreen.mount(this.root);
  }

  private handleEnterRoom(locationId: LocationId): void {
    if (this.state.stamina < MOVE_COST.ENTER_ROOM) return;
    this.state = {
      ...this.state,
      currentLocation: locationId,
      stamina: this.state.stamina - MOVE_COST.ENTER_ROOM,
    };
    this.dailyScreen?.update(this.state);
  }

  private handleExitRoom(): void {
    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    this.state = {
      ...this.state,
      currentLocation: getCorridorForFloor(currentFloor),
    };
    this.dailyScreen?.update(this.state);
  }

  private handleChangeFloor(targetFloor: Floor): void {
    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    if (!FLOOR_ADJACENCY[currentFloor].includes(targetFloor)) return;
    const cost = getFloorMoveCost(currentFloor, targetFloor);
    if (this.state.stamina < cost) return;
    this.state = {
      ...this.state,
      currentLocation: getCorridorForFloor(targetFloor),
      stamina: this.state.stamina - cost,
    };
    this.dailyScreen?.update(this.state);
  }

  private handleTalk(student: Student): void {
    if (this.state.stamina < 5) return;

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
        talkCount: s.talkCount + 1,
        affinity: Math.max(-100, Math.min(100, s.affinity + affinityGain)),
      };
    });

    // ログ生成（世界観に合わせた文面 + 色付き効果表示）
    const logLines: string[] = [];
    const talkFlavors = [
      `${student.name}と廊下で雑談をした。`,
      `${student.name}と休み時間に話し込んだ。`,
      `${student.name}と少し言葉を交わした。`,
      `${student.name}と教室で話をした。`,
    ];
    logLines.push(talkFlavors[Math.floor(Math.random() * talkFlavors.length)]);
    if (revealedHobby) {
      const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
      const pref = student.hobbies[revealedHobby];
      const prefLines: Record<string, string[]> = {
        like: [
          `話の流れで${hobbyName}の話題になり、目を輝かせて語り始めた。`,
          `「${hobbyName}って楽しいよね！」と嬉しそうに話してくれた。`,
          `${hobbyName}が好きらしく、かなり詳しいようだ。`,
        ],
        dislike: [
          `${hobbyName}の話題が出ると、あまり興味なさそうに目をそらした。`,
          `「${hobbyName}はちょっと…」と苦手そうな反応を見せた。`,
          `${hobbyName}の話になると微妙な表情を浮かべた。`,
        ],
        neutral: [
          `${hobbyName}の話題が出たが、特に思い入れはないようだ。`,
          `${hobbyName}について聞いてみたが、反応は薄かった。`,
        ],
      };
      const lines = prefLines[pref];
      const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
      const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';
      logLines.push(
        lines[Math.floor(Math.random() * lines.length)]
        + ` <span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`
      );
    }
    const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
    const affinitySign = affinityGain >= 0 ? '+' : '';
    logLines.push(`<span style="color:${affinityColor};">好感度${affinitySign}${affinityGain}</span>`);

    this.state = {
      ...this.state,
      students: updatedStudents,
      stamina: this.state.stamina - 5,
      actionLogs: [...this.state.actionLogs, logLines.join(' ')],
    };
    this.dailyScreen?.update(this.state);
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
    if (student.talkCount === 0) return;

    const battle = initBattle(student);
    this.state = {
      ...this.state,
      screen: 'battle',
      battle,
    };
    this.showBattle();
  }


  private getPlayerClassLocation(): LocationId {
    const className = this.state.playerCharacter?.className ?? '1-B';
    const map: Record<string, LocationId> = {
      '1-A': 'class1a', '1-B': 'class1b', '1-C': 'class1c', '1-D': 'class1d',
      '2-A': 'class2a', '2-B': 'class2b', '2-C': 'class2c', '2-D': 'class2d',
      '3-A': 'class3a', '3-B': 'class3b', '3-C': 'class3c', '3-D': 'class3d',
    };
    return map[className] ?? 'class1b';
  }

  private handleNextDay(): void {
    if (this.state.day >= 30) {
      this.showEnding();
      return;
    }
    const newDay = this.state.day + 1;
    this.state = {
      ...this.state,
      day: newDay,
      stamina: 100,
      currentLocation: this.getPlayerClassLocation(),
      timeSlot: 'morning',
    };
    this.showDaily();
  }

  private showBattle(): void {
    this.clearScreens();
    bgm.play(BGM_TRACKS.settoku);
    if (!this.state.battle) return;

    this.battleScreenInst = new BattleScreen(this.state, {
      onAttitudeSelect: (attitude: PlayerAttitude) => {
        if (!this.state.battle) return;
        const cost = getAttitudeCost(attitude);
        if (this.state.stamina < cost) return;
        this.state = {
          ...this.state,
          stamina: this.state.stamina - cost,
          battle: {
            ...this.state.battle,
            selectedAttitude: attitude,
            phase: 'select_topic',
          },
        };
        this.battleScreenInst?.update(this.state);
      },
      onTopicSelect: (topic: Topic) => {
        if (!this.state.battle) return;
        this.state = {
          ...this.state,
          battle: {
            ...this.state.battle,
            selectedTopic: topic,
            phase: 'select_stance',
          },
        };
        this.battleScreenInst?.update(this.state);
      },
      onStanceSelect: (stance: Stance) => {
        if (!this.state.battle || !this.state.candidate) return;
        const { selectedAttitude, selectedTopic } = this.state.battle;
        if (!selectedAttitude || !selectedTopic) return;

        const playerLikedAttributes = this.state.playerCharacter?.likedAttributes ?? [];
        const playerStats = this.state.playerCharacter?.stats ?? { speech: 50, athletic: 50, intel: 50, maxHp: 100 };
        const playerGender = this.state.playerCharacter?.gender ?? 'male';

        // プレイヤーターン
        const { newBattle: afterPlayer } = resolvePlayerTurn(
          this.state.battle, selectedAttitude, selectedTopic, stance, this.state.candidate,
          playerLikedAttributes, playerStats, playerGender
        );

        const checkedAfterPlayer = checkBattleEnd(afterPlayer);

        if (checkedAfterPlayer.phase === 'finished') {
          this.state = { ...this.state, battle: checkedAfterPlayer };
          this.battleScreenInst?.update(this.state);
          return;
        }

        // 相手ターン
        this.state = { ...this.state, battle: { ...checkedAfterPlayer, phase: 'resolving' } };
        this.battleScreenInst?.update(this.state);

        setTimeout(() => {
          if (!this.state.battle) return;
          const { newBattle: afterEnemy } = resolveEnemyTurn(this.state.battle);
          const finalBattle = checkBattleEnd(afterEnemy);
          this.state = { ...this.state, battle: finalBattle };
          this.battleScreenInst?.update(this.state);

          // 次のラウンドのパス判定
          if (finalBattle.phase === 'select_attitude') {
            setTimeout(() => this.checkPass(), 300);
          }
        }, 700);
      },
      onCancel: (phase: 'select_topic' | 'select_stance') => {
        if (!this.state.battle) return;
        if (phase === 'select_topic') {
          // 態度選択に戻る（スタミナを返還）
          const refund = this.state.battle.selectedAttitude
            ? getAttitudeCost(this.state.battle.selectedAttitude) : 0;
          this.state = {
            ...this.state,
            stamina: this.state.stamina + refund,
            battle: {
              ...this.state.battle,
              selectedAttitude: null,
              phase: 'select_attitude',
            },
          };
        } else if (phase === 'select_stance') {
          // 話題選択に戻る
          this.state = {
            ...this.state,
            battle: {
              ...this.state.battle,
              selectedTopic: null,
              phase: 'select_topic',
            },
          };
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
    this.state = {
      ...this.state,
      stamina: Math.min(100, this.state.stamina + recovery),
      battle: {
        ...this.state.battle,
        logs: [...this.state.battle.logs, passLog],
        phase: 'resolving',
      },
    };
    this.battleScreenInst?.update(this.state);

    setTimeout(() => {
      if (!this.state.battle) return;
      const { newBattle: afterEnemy } = resolveEnemyTurn(this.state.battle);
      const finalBattle = checkBattleEnd(afterEnemy);
      this.state = { ...this.state, battle: finalBattle };
      this.battleScreenInst?.update(this.state);

      // 次のラウンドもパス判定
      if (finalBattle.phase === 'select_attitude') {
        setTimeout(() => this.checkPass(), 300);
      }
    }, 700);
  }

  private finishBattle(): void {
    const battle = this.state.battle;
    if (!battle || !this.state.candidate) return;

    const result = battle.result;
    const student = battle.student;
    let shiftAmount = 0;

    // バトルログをアクションログに変換
    const battleLogLines = battle.logs.map(log => {
      const prefix = log.speaker === 'player' ? '▶ ' : '◀ ';
      return `${prefix}${log.text}`;
    });

    if (result === 'win') {
      // 成功: 相手の思想をプレイヤーの支持方向にシフト
      const newSupport = applyWinShift(student, this.state.candidate, battle.barPosition);
      shiftAmount = Math.abs(battle.barPosition);
      const updatedStudents = this.state.students.map(s => {
        if (s.id !== student.id) return s;
        return { ...s, support: newSupport };
      });
      const logEntry = `【説得成功】${student.name}を説得した！\n${battleLogLines.join('\n')}\n→ 思想シフト ${shiftAmount}`;
      this.state = {
        ...this.state,
        screen: 'daily',
        students: updatedStudents,
        battle: null,
        lastBattleResult: { student, win: true, shiftAmount },
        actionLogs: [...this.state.actionLogs, logEntry],
      };
      if (this.isAllOrganizationsUnified()) {
        this.showEnding();
      } else {
        this.showDaily();
      }
    } else if (result === 'lose') {
      // 失敗: プレイヤーの思想が相手方向にシフト
      const { newSupport, shiftPercent } = applyLoseShift(
        this.state.playerSupport, student.support, battle.barPosition
      );
      shiftAmount = shiftPercent;
      const logEntry = `【説得失敗】${student.name}に説得されてしまった…\n${battleLogLines.join('\n')}\n→ 自分の思想シフト ${shiftAmount}`;

      // プレイヤーの支持候補が変わったかチェック
      const newCandidate = getPlayerCandidate(newSupport);
      if (newCandidate !== this.state.candidate) {
        this.state = {
          ...this.state,
          screen: 'gameover',
          playerSupport: newSupport,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          actionLogs: [...this.state.actionLogs, logEntry],
        };
        this.state = { ...this.state, students: this.syncPlayerSupport(this.state.students) };
        this.showGameOver();
      } else {
        this.state = {
          ...this.state,
          screen: 'daily',
          playerSupport: newSupport,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          actionLogs: [...this.state.actionLogs, logEntry],
        };
        this.state = { ...this.state, students: this.syncPlayerSupport(this.state.students) };
        if (this.isAllOrganizationsUnified()) {
          this.showEnding();
        } else {
          this.showDaily();
        }
      }
    } else if (result === 'timeout') {
      // タイムアウト: バー位置に応じて双方の思想をシフト
      const { studentSupport, playerNewSupport, shiftPercent } = applyTimeoutShift(
        student, this.state.candidate, this.state.playerSupport, battle.barPosition
      );
      shiftAmount = shiftPercent;
      const timeoutLabel = battle.barPosition > 0 ? '時間切れ（やや優勢）' : battle.barPosition < 0 ? '時間切れ（やや劣勢）' : '時間切れ（引き分け）';
      const logEntry = `【${timeoutLabel}】${student.name}との説得\n${battleLogLines.join('\n')}\n→ 思想シフト ${shiftAmount}`;

      const updatedStudents = this.state.students.map(s => {
        if (s.id !== student.id) return s;
        return { ...s, support: studentSupport };
      });

      // プレイヤーの支持候補が変わったかチェック
      const newCandidate = getPlayerCandidate(playerNewSupport);
      if (newCandidate !== this.state.candidate) {
        this.state = {
          ...this.state,
          screen: 'gameover',
          playerSupport: playerNewSupport,
          students: updatedStudents,
          battle: null,
          lastBattleResult: { student, win: false, shiftAmount },
          actionLogs: [...this.state.actionLogs, logEntry],
        };
        this.state = { ...this.state, students: this.syncPlayerSupport(this.state.students) };
        this.showGameOver();
      } else {
        this.state = {
          ...this.state,
          screen: 'daily',
          playerSupport: playerNewSupport,
          students: updatedStudents,
          battle: null,
          lastBattleResult: { student, win: battle.barPosition > 0, shiftAmount },
          actionLogs: [...this.state.actionLogs, logEntry],
        };
        this.state = { ...this.state, students: this.syncPlayerSupport(this.state.students) };
        if (this.isAllOrganizationsUnified()) {
          this.showEnding();
        } else {
          this.showDaily();
        }
      }
    }
  }

  private showGameOver(): void {
    this.clearScreens();
    this.endingScreen = new EndingScreen(this.state, {
      onRestart: () => {
        this.state = createInitialState();
        this.showTitle();
      },
    });
    this.endingScreen.mount(this.root);
  }

  /** すべての組織が同一候補を支持しているかチェック */
  private isAllOrganizationsUnified(): boolean {
    if (ORGANIZATIONS.length === 0) return false;
    const first = getOrganizationVote(ORGANIZATIONS[0], this.state.students);
    return ORGANIZATIONS.every(org => getOrganizationVote(org, this.state.students) === first);
  }

  private showEnding(): void {
    this.clearScreens();
    this.state = { ...this.state, screen: 'ending' };
    this.endingScreen = new EndingScreen(this.state, {
      onRestart: () => {
        this.state = createInitialState();
        this.showTitle();
      },
    });
    this.endingScreen.mount(this.root);
  }
}

