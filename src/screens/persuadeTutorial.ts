import type { GameState, PlayerAttitude, Topic, Stance, FactionId, PreferenceAttr } from '../types';
import { getTutorialOpponent } from '../data';
import { ORGANIZATIONS } from '../data/organizations';
import { BattleScreen } from './battleScreen';
import {
  initBattle, resolvePlayerTurn, resolveEnemyTurn,
  getAttitudeCost,
} from '../battleLogic';
import type { Screen } from './Screen';

interface PersuadeTutorialCallbacks {
  onFinish: () => void;
}

type TutorialStep =
  | 'r1_attitude' | 'r1_topic' | 'r1_stance' | 'r1_result'
  | 'r2_attitude' | 'r2_topic' | 'r2_stance' | 'r2_result'
  | 'end';

const GUIDE_MESSAGES: Record<TutorialStep, { title: string; text: string; btn: string }> = {
  r1_attitude: {
    title: '【ラウンド1】まず雑談で機嫌を上げよう',
    text: 'いきなり思想を語っても通じにくい。<br>' +
      'まずは<strong style="color:#F0D070;">雑談</strong>で相手の機嫌を良くしよう！<br><br>' +
      '<strong style="color:#f0d060;">態度</strong>を選んでね。' +
      '<span style="color:#27AE60;">柔らかく</span>はコスト低、<span style="color:#E07820;">情熱的に</span>は効果大。',
    btn: 'OK',
  },
  r1_topic: {
    title: '趣味の話題を選ぼう',
    text: '<span style="color:#F0D070;">雑談（趣味）</span>は相手の<strong>機嫌</strong>を変える間接攻撃。<br>' +
      '趣味の横の <span style="color:#7EC850;">♥</span> は好き、<span style="color:#F07070;">✗</span> は嫌い。<br><br>' +
      '好きな話題を<span style="color:#7EC850;">肯定</span>すると機嫌が上がるよ！',
    btn: 'OK',
  },
  r1_stance: {
    title: '立場を選ぼう',
    text: '相手の<span style="color:#7EC850;">好きな話題</span>なら<span style="color:#7EC850;">肯定</span>、<br>' +
      '<span style="color:#F07070;">嫌いな話題</span>なら<span style="color:#F07070;">否定</span>で機嫌アップ！',
    btn: 'OK',
  },
  r1_result: {
    title: '機嫌が変わった！',
    text: '相手の機嫌が変化したね。<br>' +
      '機嫌が良いほど、次の<strong style="color:#7EC8F0;">思想説得</strong>が通りやすくなる！<br><br>' +
      '次はいよいよ本番——派閥の政策で説得しよう。',
    btn: '次へ',
  },
  r2_attitude: {
    title: '【ラウンド2】思想で説得しよう',
    text: '機嫌が良くなったところで、<strong style="color:#7EC8F0;">派閥の政策</strong>で攻めよう！<br>' +
      'バーを<strong>右端（+100）</strong>まで押し込めば説得成功。<br><br>' +
      '態度を選んでね。',
    btn: 'OK',
  },
  r2_topic: {
    title: '派閥の政策を選ぼう',
    text: '<span style="color:#7EC8F0;">派閥の政策</span>はバーを大きく動かす<strong>直接攻撃</strong>！<br>' +
      '相手が支持していない派閥を<span style="color:#F07070;">否定</span>するのも有効。',
    btn: 'OK',
  },
  r2_stance: {
    title: '立場を選ぼう',
    text: '自分の派閥を<span style="color:#7EC850;">肯定</span>するか、<br>' +
      '相手の派閥を<span style="color:#F07070;">否定</span>しよう！',
    btn: 'OK',
  },
  r2_result: {
    title: 'バーが動いた！',
    text: '雑談で機嫌を上げてから思想説得——<br>これが基本の流れだ！<br><br>' +
      '本番では<strong>10ラウンド</strong>繰り返して勝負がつく。',
    btn: 'OK',
  },
  end: {
    title: 'チュートリアル完了！',
    text: '説得バトルの流れはつかめたかな？<br><br>' +
      '攻略のコツ：<br>' +
      '・まず<strong>雑談で機嫌</strong>を上げてから思想説得<br>' +
      '・事前に<strong>雑談で趣味</strong>を聞いておこう<br>' +
      '・同じ話題の繰り返しは効果が下がる',
    btn: '閉じる',
  },
};

export class PersuadeTutorial implements Screen {
  private container: HTMLDivElement;
  private battleScreen: BattleScreen | null = null;
  private tutorialState: GameState;
  private callbacks: PersuadeTutorialCallbacks;
  private step: TutorialStep = 'r1_attitude';
  private overlay: HTMLDivElement;
  private tutorialRound: 1 | 2 = 1;

  constructor(callbacks: PersuadeTutorialCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed; inset:0; z-index:150;';

    this.overlay = document.createElement('div');

    this.tutorialState = this.createTutorialState();

    // バトル画面を即座に表示し、最初のガイドを出す
    this.startBattle();
    setTimeout(() => this.showGuide('r1_attitude'), 300);
  }

  private createTutorialState(): GameState {
    const opponent = getTutorialOpponent();
    const battle = initBattle(opponent, false, 'male', []);

    return {
      screen: 'battle',
      faction: 'progressive' as FactionId,
      students: [opponent],
      day: 1,
      currentTime: 0,
      stamina: 100,
      currentLocation: 'class2a',
      timeSlot: 'afterschool',
      battle,
      lastBattleResult: null,
      playerCharacter: {
        id: 'tutorial_player',
        name: 'あなた',
        gender: 'male',
        className: '2-B',
        personality: 'flexible',
        hobbies: {
          love: 'neutral', game: 'like', sns: 'neutral',
          sports_hobby: 'neutral', study: 'neutral', video: 'neutral',
          music: 'like', reading: 'neutral', fashion: 'neutral', fortune: 'neutral',
        },
        attributes: [],
        likedAttributes: [] as PreferenceAttr[],
        dislikedAttributes: [] as PreferenceAttr[],
        stats: { speech: 60, athletic: 40, intel: 50, maxHp: 100 },
        portrait: null,
      },
      playerAttributes: [] as PreferenceAttr[],
      playerSupport: { conservative: 20, progressive: 50, sports: 30 },
      organizations: ORGANIZATIONS,
      actionLogs: [],
      activists: [],
      lostItem: null,
      errand: null,
      tutorial: { seenPrologue: true, seenMove: true, seenTalk: true },
    };
  }

  private showGuide(step: TutorialStep): void {
    this.step = step;
    const msg = GUIDE_MESSAGES[step];

    // バトル画面がある場合は操作をブロック
    if (this.battleScreen) {
      const battleEl = this.container.firstElementChild as HTMLElement | null;
      if (battleEl) battleEl.style.pointerEvents = 'none';
    }

    this.overlay.style.cssText = `
      position:absolute; inset:0; z-index:200;
      background:rgba(0,0,20,0.5);
      display:flex; flex-direction:column;
      align-items:center; justify-content:flex-end;
      padding:16px; box-sizing:border-box;
      font-family:var(--game-font);
      animation: fadeIn 0.2s ease;
    `;

    this.overlay.innerHTML = `
      <div class="game-panel-dark" style="
        max-width:400px; width:100%;
        padding:20px; margin-bottom:20px;
        animation: game-slide-up 0.2s ease;
      ">
        <div style="
          color:#f0d060; font-weight:900; font-size:1em;
          margin-bottom:10px; text-align:center;
        ">${msg.title}</div>
        <div style="
          color:rgba(255,255,255,0.85); font-size:0.85em;
          line-height:1.8; text-align:center;
        ">${msg.text}</div>
        <div style="text-align:center; margin-top:16px;">
          <button id="guide-btn" class="game-btn game-btn-primary" style="
            padding:10px 32px; font-size:0.9em; font-family:var(--game-font);
          ">${msg.btn}</button>
        </div>
      </div>
    `;

    // 既存のオーバーレイがあれば差し替え
    if (!this.overlay.parentElement) {
      this.container.appendChild(this.overlay);
    }

    this.overlay.querySelector('#guide-btn')?.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      this.onGuideOk();
    });
  }

  private hideGuide(): void {
    this.overlay.remove();
    // バトル画面の操作を再開
    const battleEl = this.container.firstElementChild as HTMLElement | null;
    if (battleEl) battleEl.style.pointerEvents = '';
  }

  private onGuideOk(): void {
    switch (this.step) {
      case 'r1_attitude':
      case 'r1_topic':
      case 'r1_stance':
      case 'r2_attitude':
      case 'r2_topic':
      case 'r2_stance':
        this.hideGuide();
        // プレイヤーの操作を待つ
        break;
      case 'r1_result':
        this.hideGuide();
        // ラウンド2へ: バトルフェーズをリセット
        this.tutorialRound = 2;
        if (this.tutorialState.battle) {
          this.tutorialState = {
            ...this.tutorialState,
            battle: {
              ...this.tutorialState.battle,
              selectedAttitude: null,
              selectedTopic: null,
              selectedStance: null,
              phase: 'select_attitude',
            },
          };
          this.battleScreen?.update(this.tutorialState);
        }
        setTimeout(() => this.showGuide('r2_attitude'), 300);
        break;
      case 'r2_result':
        this.hideGuide();
        setTimeout(() => this.showGuide('end'), 300);
        break;
      case 'end':
        this.callbacks.onFinish();
        break;
    }
  }

  private startBattle(): void {
    this.battleScreen = new BattleScreen(this.tutorialState, {
      onAttitudeSelect: (attitude: PlayerAttitude) => {
        if (!this.tutorialState.battle) return;
        const cost = getAttitudeCost(attitude);
        if (this.tutorialState.stamina < cost) return;
        this.tutorialState = {
          ...this.tutorialState,
          stamina: this.tutorialState.stamina - cost,
          battle: {
            ...this.tutorialState.battle,
            selectedAttitude: attitude,
            phase: 'select_topic',
          },
        };
        this.battleScreen?.update(this.tutorialState);
        const topicStep = this.tutorialRound === 1 ? 'r1_topic' : 'r2_topic';
        setTimeout(() => this.showGuide(topicStep), 200);
      },
      onTopicSelect: (topic: Topic) => {
        if (!this.tutorialState.battle) return;
        this.tutorialState = {
          ...this.tutorialState,
          battle: {
            ...this.tutorialState.battle,
            selectedTopic: topic,
            phase: 'select_stance',
          },
        };
        this.battleScreen?.update(this.tutorialState);
        const stanceStep = this.tutorialRound === 1 ? 'r1_stance' : 'r2_stance';
        setTimeout(() => this.showGuide(stanceStep), 200);
      },
      onStanceSelect: (stance: Stance) => {
        if (!this.tutorialState.battle || !this.tutorialState.faction) return;
        const { selectedAttitude, selectedTopic } = this.tutorialState.battle;
        if (!selectedAttitude || !selectedTopic) return;

        const playerStats = this.tutorialState.playerCharacter?.stats ?? { speech: 60, athletic: 40, intel: 50, maxHp: 100 };
        const playerGender = this.tutorialState.playerCharacter?.gender ?? 'male';

        // プレイヤーターン
        const { newBattle: afterPlayer } = resolvePlayerTurn(
          this.tutorialState.battle, selectedAttitude, selectedTopic, stance,
          this.tutorialState.faction,
          [], playerStats, playerGender
        );

        // resolving フェーズ表示
        this.tutorialState = { ...this.tutorialState, battle: { ...afterPlayer, phase: 'resolving' } };
        this.battleScreen?.update(this.tutorialState);

        // 敵ターン
        const resultStep = this.tutorialRound === 1 ? 'r1_result' : 'r2_result';
        setTimeout(() => {
          if (!this.tutorialState.battle) return;
          const { newBattle: afterEnemy } = resolveEnemyTurn(this.tutorialState.battle);

          // ラウンド終了 → 強制的にfinishedにはせず、結果を見せてからガイド
          this.tutorialState = { ...this.tutorialState, battle: afterEnemy };
          this.battleScreen?.update(this.tutorialState);

          setTimeout(() => this.showGuide(resultStep), 400);
        }, 700);
      },
      onCancel: (phase: 'select_topic' | 'select_stance') => {
        if (!this.tutorialState.battle) return;
        if (phase === 'select_topic') {
          const refund = this.tutorialState.battle.selectedAttitude
            ? getAttitudeCost(this.tutorialState.battle.selectedAttitude) : 0;
          this.tutorialState = {
            ...this.tutorialState,
            stamina: this.tutorialState.stamina + refund,
            battle: {
              ...this.tutorialState.battle,
              selectedAttitude: null,
              phase: 'select_attitude',
            },
          };
        } else if (phase === 'select_stance') {
          this.tutorialState = {
            ...this.tutorialState,
            battle: {
              ...this.tutorialState.battle,
              selectedTopic: null,
              phase: 'select_topic',
            },
          };
        }
        this.battleScreen?.update(this.tutorialState);
      },
    });

    // バトル画面をcontainerの先頭に挿入（overlayの下に）
    const battleWrapper = document.createElement('div');
    battleWrapper.style.cssText = 'position:absolute; inset:0;';
    this.battleScreen.mount(battleWrapper);
    this.container.insertBefore(battleWrapper, this.container.firstChild);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.battleScreen?.unmount();
    this.battleScreen = null;
    this.container.remove();
  }
}
