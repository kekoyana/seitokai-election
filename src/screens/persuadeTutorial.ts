import type { GameState, PlayerAttitude, Topic, Stance, FactionId, PreferenceAttr } from '../types';
import { getTutorialOpponent } from '../data';
import { ORGANIZATIONS } from '../data/organizations';
import suzukiShotaPortrait from '../../assets/portraits/suzuki_shota.webp';
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

/** 各ステップで許可するボタン（nullなら全許可）
 *  value: 単一値を強制, values: 複数値を許可 */
type ForcedChoice = { attr: string; value: string } | { attr: string; values: string[] } | null;
const FORCED_CHOICES: Partial<Record<TutorialStep, ForcedChoice>> = {
  r1_attitude: { attr: 'data-attitude', value: 'normal' },
  r1_topic:    { attr: 'data-topic', value: 'sns' },
  r1_stance:   { attr: 'data-stance', value: 'positive' },
  r2_attitude: null, // 自由
  r2_topic:    { attr: 'data-topic', values: ['conservative', 'progressive', 'sports'] },
  r2_stance:   null,
};

const GUIDE_MESSAGES: Record<TutorialStep, { title: string; text: string; btn?: string }> = {
  r1_attitude: {
    title: 'まず雑談で機嫌を上げよう',
    text: 'いきなり思想を語っても通じにくい。まずは<strong style="color:#F0D070;">雑談</strong>で相手の機嫌を良くしよう！<br>' +
      '<strong style="color:#4A90D9;">「普通に」</strong>を選んでね。',
  },
  r1_topic: {
    title: '趣味の話題を選ぼう',
    text: '趣味の横の <span style="color:#7EC850;">♥</span> は好き、<span style="color:#F07070;">✗</span> は嫌い。<br>' +
      'あおいの好きな<strong style="color:#7EC850;">「SNS」</strong>を選ぼう！',
  },
  r1_stance: {
    title: '立場を選ぼう',
    text: '好きな話題は<strong style="color:#7EC850;">「肯定」</strong>すると機嫌がアップ！',
  },
  r1_result: {
    title: '機嫌が上がった！',
    text: '機嫌が良いほど、思想説得の効果が<strong>大きく</strong>なる！<br>' +
      '次はいよいよ派閥の政策で説得しよう。',
    btn: '次へ',
  },
  r2_attitude: {
    title: '思想で説得しよう',
    text: '機嫌が良くなったところで、<strong style="color:#7EC8F0;">派閥の政策</strong>で攻めよう！<br>' +
      '今度は自由に選んでみて。',
  },
  r2_topic: {
    title: '派閥の政策を選ぼう',
    text: '<span style="color:#7EC8F0;">派閥の政策</span>はバーを大きく動かす直接攻撃！<br>' +
      '自分の派閥を推すか、相手の派閥を攻撃しよう。',
  },
  r2_stance: {
    title: '立場を選ぼう',
    text: '自分の派閥なら<span style="color:#7EC850;">肯定</span>、相手の派閥なら<span style="color:#F07070;">否定</span>が有効！',
  },
  r2_result: {
    title: 'バーが動いた！',
    text: '雑談で機嫌を上げてから思想説得——これが基本の流れだ！<br>' +
      '本番では<strong>10ラウンド</strong>繰り返して勝負がつく。',
    btn: 'OK',
  },
  end: {
    title: 'チュートリアル完了！',
    text: '攻略のコツ：<br>' +
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
  private guidePanel: HTMLDivElement;
  private tutorialRound: 1 | 2 = 1;

  constructor(callbacks: PersuadeTutorialCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed; inset:0; z-index:150;';

    this.guidePanel = document.createElement('div');

    this.tutorialState = this.createTutorialState();

    this.startBattle();
    setTimeout(() => this.showGuide('r1_attitude'), 300);
  }

  private createTutorialState(): GameState {
    const opponent = getTutorialOpponent();
    const battle = initBattle(opponent, false, 'male', []);

    return {
      screen: 'battle',
      faction: 'conservative' as FactionId,
      students: [opponent],
      day: 1,
      currentTime: 0,
      stamina: 100,
      currentLocation: 'class2a',
      timeSlot: 'afterschool',
      battle,
      lastBattleResult: null,
      playerCharacter: {
        id: 's30102',
        name: '鈴木翔太',
        gender: 'male',
        className: '3-A',
        personality: 'cautious',
        hobbies: {
          love: 'like', game: 'neutral', sns: 'neutral',
          sports_hobby: 'dislike', study: 'neutral', video: 'neutral',
          music: 'like', reading: 'neutral', fashion: 'neutral', fortune: 'neutral',
        },
        attributes: [],
        likedAttributes: ['fashionable', 'cool', 'adult', 'bob', 'busty'] as PreferenceAttr[],
        dislikedAttributes: ['sporty', 'delinquent', 'twintail'] as PreferenceAttr[],
        stats: { speech: 70, athletic: 20, intel: 65, maxHp: 85 },
        portrait: suzukiShotaPortrait,
      },
      playerAttributes: ['cool', 'fashionable', 'straight'] as PreferenceAttr[],
      playerSupport: { conservative: 50, progressive: 30, sports: 20 },
      organizations: ORGANIZATIONS,
      actionLogs: [],
      activists: [],
      lostItem: null,
      errand: null,
      tutorial: { seenPrologue: true, seenMove: true, seenTalk: true },
    };
  }

  /** ガイドメッセージを画面下に表示し、強制選択のハイライトを適用 */
  private showGuide(step: TutorialStep): void {
    this.step = step;
    const msg = GUIDE_MESSAGES[step];
    const forced = FORCED_CHOICES[step];

    // バトル画面のボタンにハイライト/暗転を適用
    this.applyHighlight(forced ?? null);

    // 機嫌表示のハイライト
    this.highlightMood(step === 'r1_result');

    // ガイドパネル（画面下部に固定）
    this.guidePanel.style.cssText = `
      position:absolute; bottom:0; left:0; right:0; z-index:200;
      padding:12px 16px;
      background:linear-gradient(180deg, rgba(0,0,20,0.0) 0%, rgba(0,0,20,0.85) 20%);
      font-family:var(--game-font);
      animation: fadeIn 0.2s ease;
      pointer-events:auto;
    `;

    const btnHtml = msg.btn
      ? `<div style="text-align:center; margin-top:10px;">
          <button id="guide-btn" class="game-btn game-btn-primary" style="
            padding:8px 28px; font-size:0.85em; font-family:var(--game-font);
          ">${msg.btn}</button>
        </div>`
      : '';

    this.guidePanel.innerHTML = `
      <div style="max-width:400px; margin:0 auto;">
        <div style="
          color:#f0d060; font-weight:900; font-size:0.9em;
          margin-bottom:6px; text-align:center;
        ">${msg.title}</div>
        <div style="
          color:rgba(255,255,255,0.85); font-size:0.8em;
          line-height:1.7; text-align:center;
        ">${msg.text}</div>
        ${btnHtml}
      </div>
    `;

    if (!this.guidePanel.parentElement) {
      this.container.appendChild(this.guidePanel);
    }

    // ボタンがある場合はバトル操作をブロック（結果表示・終了時）
    if (msg.btn) {
      const battleEl = this.container.firstElementChild as HTMLElement | null;
      if (battleEl) battleEl.style.pointerEvents = 'none';

      this.guidePanel.querySelector('#guide-btn')?.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        this.onGuideOk();
      });
    }
  }

  /** 強制選択のボタンをハイライトし、それ以外を暗くする */
  private applyHighlight(forced: ForcedChoice): void {
    const battleEl = this.container.firstElementChild as HTMLElement | null;
    if (!battleEl) return;

    // ボタン操作は許可
    battleEl.style.pointerEvents = '';

    // 全ボタンのスタイルをリセット
    battleEl.querySelectorAll<HTMLElement>('[data-attitude], [data-topic], [data-stance], #cancel-btn').forEach(btn => {
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
      btn.style.boxShadow = '';
    });

    if (!forced) return;

    // 許可される値のセット
    const allowedValues = 'value' in forced
      ? new Set([forced.value])
      : new Set(forced.values);
    const isSingleForced = 'value' in forced;

    // 同じ属性グループのボタンのみ対象
    battleEl.querySelectorAll<HTMLElement>(`[${forced.attr}]`).forEach(btn => {
      const val = btn.getAttribute(forced.attr);
      if (val && allowedValues.has(val)) {
        // 単一強制ならハイライト、複数許可ならそのまま
        if (isSingleForced) {
          btn.style.boxShadow = '0 0 12px rgba(240,208,96,0.6), 0 0 4px rgba(240,208,96,0.4)';
        }
      } else {
        // 暗転＋操作不可
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
      }
    });

    // キャンセルボタンも無効化（単一強制時）
    if (isSingleForced) {
      const cancelBtn = battleEl.querySelector<HTMLElement>('#cancel-btn');
      if (cancelBtn) {
        cancelBtn.style.opacity = '0.3';
        cancelBtn.style.pointerEvents = 'none';
      }
    }
  }

  /** 機嫌表示をハイライトする */
  private highlightMood(on: boolean): void {
    const battleEl = this.container.firstElementChild as HTMLElement | null;
    if (!battleEl) return;
    const moodArea = battleEl.querySelector<HTMLElement>('#mood-area');
    if (!moodArea) return;
    if (on) {
      moodArea.style.boxShadow = '0 0 12px rgba(240,208,96,0.7), 0 0 4px rgba(240,208,96,0.5)';
      moodArea.style.background = 'rgba(240,208,96,0.25)';
    } else {
      moodArea.style.boxShadow = '';
      moodArea.style.background = 'rgba(255,255,255,0.1)';
    }
  }

  private hideGuide(): void {
    this.guidePanel.remove();
    this.highlightMood(false);
    // ハイライトをクリア
    const battleEl = this.container.firstElementChild as HTMLElement | null;
    if (battleEl) {
      battleEl.style.pointerEvents = '';
      battleEl.querySelectorAll<HTMLElement>('[data-attitude], [data-topic], [data-stance], #cancel-btn').forEach(btn => {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
        btn.style.boxShadow = '';
      });
    }
  }

  private onGuideOk(): void {
    switch (this.step) {
      case 'r1_result':
        this.hideGuide();
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
      default:
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
        const topicStep: TutorialStep = this.tutorialRound === 1 ? 'r1_topic' : 'r2_topic';
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
        const stanceStep: TutorialStep = this.tutorialRound === 1 ? 'r1_stance' : 'r2_stance';
        setTimeout(() => this.showGuide(stanceStep), 200);
      },
      onStanceSelect: (stance: Stance) => {
        if (!this.tutorialState.battle || !this.tutorialState.faction) return;
        const { selectedAttitude, selectedTopic } = this.tutorialState.battle;
        if (!selectedAttitude || !selectedTopic) return;

        // ガイドを消す
        this.hideGuide();

        const playerStats = this.tutorialState.playerCharacter?.stats ?? { speech: 60, athletic: 40, intel: 50, maxHp: 100 };
        const playerGender = this.tutorialState.playerCharacter?.gender ?? 'male';

        // プレイヤーターン
        const { newBattle: afterPlayer } = resolvePlayerTurn(
          this.tutorialState.battle, selectedAttitude, selectedTopic, stance,
          this.tutorialState.faction,
          this.tutorialState.playerAttributes as PreferenceAttr[],
          playerStats, playerGender
        );

        // resolving フェーズ表示
        this.tutorialState = { ...this.tutorialState, battle: { ...afterPlayer, phase: 'resolving' } };
        this.battleScreen?.update(this.tutorialState);

        // 敵ターン
        const resultStep: TutorialStep = this.tutorialRound === 1 ? 'r1_result' : 'r2_result';
        setTimeout(() => {
          if (!this.tutorialState.battle) return;
          const { newBattle: afterEnemy } = resolveEnemyTurn(this.tutorialState.battle);

          this.tutorialState = { ...this.tutorialState, battle: afterEnemy };
          this.battleScreen?.update(this.tutorialState);

          setTimeout(() => this.showGuide(resultStep), 400);
        }, 700);
      },
      onCancel: () => {
        // チュートリアル中はキャンセル無効
      },
    });

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
