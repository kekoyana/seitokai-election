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

type TutorialStep = 'intro' | 'attitude' | 'topic' | 'stance' | 'resolving' | 'end';

const GUIDE_MESSAGES: Record<TutorialStep, { title: string; text: string; btn: string }> = {
  intro: {
    title: '説得バトルを体験しよう',
    text: '渡辺あおいを相手に、1ラウンドだけ練習してみよう。<br>実際にボタンを押して流れをつかもう！',
    btn: 'はじめる',
  },
  attitude: {
    title: '【1】態度を選ぼう',
    text: 'まず<strong style="color:#f0d060;">態度</strong>を選ぼう。<br>' +
      '<span style="color:#27AE60;">柔らかく</span>はスタミナ節約、<span style="color:#E07820;">情熱的に</span>は効果大だがコストも高い。<br><br>' +
      '画面上のバーを<strong>右端（+100）</strong>まで押し込めば説得成功！',
    btn: 'OK',
  },
  topic: {
    title: '【2】話題を選ぼう',
    text: '<span style="color:#7EC8F0;">派閥の政策</span>はバーを大きく動かす直接攻撃。<br>' +
      '<span style="color:#F0D070;">雑談（趣味）</span>は相手の機嫌を変える間接攻撃。<br><br>' +
      '趣味の横の <span style="color:#7EC850;">♥</span> は好き、<span style="color:#F07070;">✗</span> は嫌い。事前の情報収集が活きるよ！',
    btn: 'OK',
  },
  stance: {
    title: '【3】立場を選ぼう',
    text: '<span style="color:#7EC850;">肯定</span>か<span style="color:#F07070;">否定</span>を選ぼう。<br>' +
      '正しい組み合わせならバーが有利に動く！',
    btn: 'OK',
  },
  resolving: {
    title: '相手の反撃',
    text: '相手も反撃してくる。これが1ラウンドの流れだ！<br>' +
      '本番では<strong>10ラウンド</strong>繰り返して勝負がつく。',
    btn: 'OK',
  },
  end: {
    title: 'チュートリアル完了！',
    text: '説得バトルの流れはつかめたかな？<br><br>' +
      '攻略のコツ：<br>' +
      '・事前に<strong>雑談で趣味</strong>を聞いておこう<br>' +
      '・相手の<strong>機嫌</strong>が良いほど説得が通りやすい<br>' +
      '・同じ話題の繰り返しは効果が下がる',
    btn: '閉じる',
  },
};

export class PersuadeTutorial implements Screen {
  private container: HTMLDivElement;
  private battleScreen: BattleScreen | null = null;
  private tutorialState: GameState;
  private callbacks: PersuadeTutorialCallbacks;
  private step: TutorialStep = 'intro';
  private overlay: HTMLDivElement;

  constructor(callbacks: PersuadeTutorialCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:fixed; inset:0; z-index:150;';

    this.overlay = document.createElement('div');

    this.tutorialState = this.createTutorialState();

    this.showGuide('intro');
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
      case 'intro':
        this.hideGuide();
        this.startBattle();
        // 少し待ってから態度ガイドを表示
        setTimeout(() => this.showGuide('attitude'), 300);
        break;
      case 'attitude':
      case 'topic':
      case 'stance':
        this.hideGuide();
        // プレイヤーの操作を待つ
        break;
      case 'resolving':
        this.hideGuide();
        // 終了ガイドを表示
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
        // 話題ガイドを表示
        setTimeout(() => this.showGuide('topic'), 200);
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
        // 立場ガイドを表示
        setTimeout(() => this.showGuide('stance'), 200);
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
        setTimeout(() => {
          if (!this.tutorialState.battle) return;
          const { newBattle: afterEnemy } = resolveEnemyTurn(this.tutorialState.battle);

          // 1ラウンド終了 → 強制的にfinishedにはせず、結果を見せてからガイド
          this.tutorialState = { ...this.tutorialState, battle: afterEnemy };
          this.battleScreen?.update(this.tutorialState);

          // 反撃後のガイド表示
          setTimeout(() => this.showGuide('resolving'), 400);
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
