import type { GameState, LocationId, Floor } from '../../types';
import {
  LOCATIONS, FLOOR_LABELS, MOVE_COST,
  getFloorFromLocation, getFloorMoveCost, getStudentLocation, MAX_TIME, dayToDate,
} from '../../data';

export interface MapContext {
  state: GameState;
}

function countStudentsAtLocation(ctx: MapContext, locId: LocationId): number {
  const playerId = ctx.state.playerCharacter?.id;
  return ctx.state.students.filter(s =>
    s.id !== playerId &&
    getStudentLocation(s.id, ctx.state.timeSlot, ctx.state.day, ctx.state.currentTime) === locId
  ).length;
}

const roomStyle = { bg: '#dce8f4', border: '#6a8cb8' };
const specialRoomStyle = { bg: '#e8ddf4', border: '#8a6cb8' };
const facilityStyle = { bg: '#d8ecda', border: '#6aaa70' };

function renderRoomBtn(ctx: MapContext, roomId: LocationId, canEnter: boolean, style: { bg: string; border: string; w?: string; h?: string }): string {
  const loc = LOCATIONS.find(l => l.id === roomId);
  const count = countStudentsAtLocation(ctx, roomId);
  const hasStudents = count > 0;
  const shortName = (loc?.name ?? roomId).replace('教室 ', '');
  return `
    <button data-enter-room="${roomId}" style="
      ${style.w ? `width:${style.w};` : ''}
      ${style.h ? `height:${style.h};` : ''}
      padding:8px 4px;
      background:${hasStudents ? style.bg : '#f0f2f4'};
      border:2px solid ${hasStudents ? style.border : '#b8c0c8'};
      min-height:40px;
      cursor:${canEnter ? 'pointer' : 'not-allowed'};
      text-align:center; font-family:inherit;
      opacity:${canEnter ? '1' : '0.6'};
      position:relative; box-sizing:border-box;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      box-shadow:${hasStudents ? `inset 0 0 12px ${style.border}40, 0 1px 3px rgba(0,0,0,0.1)` : '0 1px 2px rgba(0,0,0,0.05)'};
    ">
      <div style="font-weight:bold; font-size:0.88em; color:#333; line-height:1.2; overflow:hidden; text-overflow:ellipsis; max-width:100%;">${shortName}</div>
      ${hasStudents
        ? `<div style="
            position:absolute; top:-7px; right:-7px;
            background:#E74C3C; color:#fff;
            border-radius:50%; width:18px; height:18px;
            font-size:0.6em; font-weight:bold;
            display:flex; align-items:center; justify-content:center;
            border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,0.3);
          ">${count}</div>`
        : ''
      }
    </button>
  `;
}

function renderStairsBtn(ctx: MapContext, targetFloor: Floor, currentFloor: Floor, direction: 'up' | 'down'): string {
  const cost = getFloorMoveCost(currentFloor, targetFloor);
  const canAfford = ctx.state.stamina >= cost;
  const pattern = direction === 'up'
    ? 'repeating-linear-gradient(0deg, #707878 0px, #707878 3px, #889090 3px, #889090 6px)'
    : 'repeating-linear-gradient(180deg, #707878 0px, #707878 3px, #889090 3px, #889090 6px)';
  return `
    <button data-change-floor="${targetFloor}" style="
      padding:4px 8px;
      background:${canAfford ? pattern : '#bbb'};
      color:#fff; border:2px solid #606868; border-radius:3px;
      font-size:0.65em; font-weight:bold;
      cursor:${canAfford ? 'pointer' : 'not-allowed'};
      font-family:inherit; text-align:center;
      text-shadow:0 1px 2px rgba(0,0,0,0.5);
      box-shadow:inset 0 0 4px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2);
    ">
      ${direction === 'up' ? '▲' : '▼'}${FLOOR_LABELS[targetFloor]}<br>⚡${cost}
    </button>
  `;
}

function renderBuildingEntrance(ctx: MapContext, currentFloor: Floor): string {
  const cost = getFloorMoveCost(currentFloor, '1f');
  const canAfford = ctx.state.stamina >= cost;
  return `
    <button data-change-floor="1f" style="
      padding:6px 0; width:100%;
      background:${canAfford ? 'linear-gradient(180deg, #8090a0 0%, #6a7a8a 100%)' : '#bbb'};
      color:#fff; border:3px solid #506070; border-radius:4px;
      font-size:0.72em; font-weight:bold;
      cursor:${canAfford ? 'pointer' : 'not-allowed'};
      font-family:inherit; text-align:center;
      text-shadow:0 1px 2px rgba(0,0,0,0.4);
      box-shadow:0 2px 6px rgba(0,0,0,0.2);
    ">
      <div>🏫 校舎</div>
      <div style="font-size:0.85em; opacity:0.9;">⚡${cost}</div>
    </button>
  `;
}

function renderGroundExit(ctx: MapContext, currentFloor: Floor): string {
  const cost = getFloorMoveCost(currentFloor, 'ground');
  const canAfford = ctx.state.stamina >= cost;
  return `
    <button data-change-floor="ground" style="
      padding:4px 8px;
      background:${canAfford ? 'linear-gradient(180deg, #6a9050 0%, #4a7030 100%)' : '#bbb'};
      color:#fff; border:2px solid #3a5828; border-radius:4px;
      font-size:0.65em; font-weight:bold;
      cursor:${canAfford ? 'pointer' : 'not-allowed'};
      font-family:inherit; text-align:center;
      text-shadow:0 1px 2px rgba(0,0,0,0.4);
    ">
      🌳外へ ⚡${cost}
    </button>
  `;
}

function renderCorridor(): string {
  return `<div style="
    height:18px;
    background:linear-gradient(180deg, #c8cdd2 0%, #d8dce0 30%, #e0e4e8 70%, #c8cdd2 100%);
    border-top:2px solid #9aa0a8; border-bottom:2px solid #9aa0a8;
    margin:0; position:relative;
  ">
    <div style="
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      font-size:0.55em; color:#8890a0; letter-spacing:4px; white-space:nowrap;
    ">廊　下</div>
  </div>`;
}

function renderBuildingWrap(floorLabel: string, content: string): string {
  return `
    <div style="font-size:0.78em; font-weight:bold; color:#4a6080; margin-bottom:4px;">
      ${floorLabel}
    </div>
    <div style="
      background:linear-gradient(135deg, #eaeff4 0%, #f4f6f8 100%);
      border:3px solid #8090a0;
      border-radius:4px;
      overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);
    ">
      ${content}
    </div>
    <div style="font-size:0.58em; color:#aaa; text-align:center; margin-top:4px;">
      部屋をタップして入室 ⚡${MOVE_COST.ENTER_ROOM}
    </div>
  `;
}

function renderRooftopStairsBtn(ctx: MapContext, canEnter: boolean): string {
  const count = countStudentsAtLocation(ctx, 'rooftop');
  const hasStudents = count > 0;
  return `
    <button data-enter-room="rooftop" style="
      padding:4px 8px;
      background:${canEnter
        ? 'repeating-linear-gradient(0deg, #507858 0px, #507858 3px, #609868 3px, #609868 6px)'
        : '#bbb'};
      color:#fff; border:2px solid #406848; border-radius:3px;
      font-size:0.65em; font-weight:bold;
      cursor:${canEnter ? 'pointer' : 'not-allowed'};
      font-family:inherit; text-align:center;
      text-shadow:0 1px 2px rgba(0,0,0,0.5);
      box-shadow:inset 0 0 4px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2);
      position:relative;
    ">
      ▲屋上<br>⚡${MOVE_COST.ENTER_ROOM}
      ${hasStudents ? `<div style="
        position:absolute; top:-7px; right:-7px;
        background:#E74C3C; color:#fff;
        border-radius:50%; width:18px; height:18px;
        font-size:0.6em; font-weight:bold;
        display:flex; align-items:center; justify-content:center;
        border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,0.3);
      ">${count}</div>` : ''}
    </button>
  `;
}

function renderFloor3Plan(ctx: MapContext, canEnter: boolean): string {
  const r = roomStyle;
  const s = specialRoomStyle;
  const content = `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class3a', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class3b', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class3c', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class3d', canEnter, r)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderStairsBtn(ctx, '2f', '3f', 'down')}
      </div>
    </div>
    ${renderCorridor()}
    <div style="display:grid; grid-template-columns:1fr auto; gap:0; border-top:1px solid #a0a8b0;">
      <div style="padding:3px;">${renderRoomBtn(ctx, 'student_council', canEnter, s)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderRooftopStairsBtn(ctx, canEnter)}
      </div>
    </div>
  `;
  return renderBuildingWrap('🏫 3階', content);
}

function renderFloor2Plan(ctx: MapContext, canEnter: boolean): string {
  const r = roomStyle;
  const s = specialRoomStyle;
  const content = `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class2a', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class2b', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class2c', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class2d', canEnter, r)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderStairsBtn(ctx, '3f', '2f', 'up')}
      </div>
    </div>
    ${renderCorridor()}
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:0; border-top:1px solid #a0a8b0;">
      <div style="padding:3px; border-right:1px solid #a0a8b0;">${renderRoomBtn(ctx, 'music_room', canEnter, s)}</div>
      <div style="padding:3px; border-right:1px solid #a0a8b0;">${renderRoomBtn(ctx, 'art_room', canEnter, s)}</div>
      <div style="padding:3px; border-right:1px solid #a0a8b0;">${renderRoomBtn(ctx, 'broadcast_room', canEnter, s)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderStairsBtn(ctx, '1f', '2f', 'down')}
      </div>
    </div>
  `;
  return renderBuildingWrap('🏫 2階', content);
}

function renderFloor1Plan(ctx: MapContext, canEnter: boolean): string {
  const r = roomStyle;
  const f = facilityStyle;
  const content = `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class1a', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class1b', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class1c', canEnter, r)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'class1d', canEnter, r)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderStairsBtn(ctx, '2f', '1f', 'up')}
      </div>
    </div>
    ${renderCorridor()}
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-top:1px solid #a0a8b0;">
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'cafeteria', canEnter, f)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'library', canEnter, f)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'nurses_office', canEnter, f)}</div>
      <div style="border-right:1px solid #a0a8b0; padding:3px;">${renderRoomBtn(ctx, 'courtyard', canEnter, f)}</div>
      <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
        ${renderGroundExit(ctx, '1f')}
      </div>
    </div>
  `;
  return renderBuildingWrap('🏫 1階', content);
}

function renderGroundPlan(ctx: MapContext, canEnter: boolean): string {
  const fieldStyle = { bg: '#c8e0a8', border: '#6a9848' };
  const courtStyle = { bg: '#e8d8b0', border: '#b0944a' };
  const tree = `<div style="
    width:14px; height:14px; border-radius:50%;
    background:radial-gradient(circle at 40% 40%, #6abf50, #3a8030);
    box-shadow:1px 1px 2px rgba(0,0,0,0.2);
    flex-shrink:0;
  "></div>`;
  const treeRow = (n: number) => `<div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">${Array(n).fill(tree).join('')}</div>`;

  return `
    <div style="font-size:0.78em; font-weight:bold; color:#3a6830; margin-bottom:4px;">
      🌳 グラウンド
    </div>
    <div style="
      background:linear-gradient(180deg, #d0e8b8 0%, #b8d8a0 50%, #a8c890 100%);
      border:3px solid #6a9050;
      border-radius:8px;
      padding:8px;
      box-shadow:0 2px 8px rgba(0,0,0,0.1);
      position:relative;
    ">
      <div style="margin-bottom:8px;">
        ${renderBuildingEntrance(ctx, 'ground')}
      </div>

      ${treeRow(8)}

      <div style="display:flex; gap:6px; margin:8px 0;">
        <div style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
          ${tree}${tree}${tree}
        </div>

        <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
          <div style="
            background:#98c878;
            border:3px solid #e8d0a0;
            border-radius:40px;
            padding:8px;
          ">
            <div style="
              border:2px dashed rgba(255,255,255,0.5);
              border-radius:30px;
              padding:6px;
              display:grid; grid-template-columns:1fr 1fr; gap:6px;
            ">
              ${renderRoomBtn(ctx, 'track_field', canEnter, fieldStyle)}
              ${renderRoomBtn(ctx, 'soccer_field', canEnter, fieldStyle)}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div style="
              background:#98c070;
              border:2px solid #78a050;
              border-radius:6px; padding:4px;
            ">
              ${renderRoomBtn(ctx, 'baseball_field', canEnter, fieldStyle)}
            </div>
            <div style="
              background:#d0c8a0;
              border:2px solid #b0a070;
              border-radius:4px; padding:4px;
            ">
              ${renderRoomBtn(ctx, 'tennis_court', canEnter, courtStyle)}
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
          ${tree}${tree}${tree}
        </div>
      </div>

      ${treeRow(8)}
    </div>
    <div style="font-size:0.58em; color:#aaa; text-align:center; margin-top:4px;">
      施設をタップして入場 ⚡${MOVE_COST.ENTER_ROOM}
    </div>
  `;
}

function renderFloorPlan(ctx: MapContext, floor: Floor, canEnter: boolean): string {
  switch (floor) {
    case '3f': return renderFloor3Plan(ctx, canEnter);
    case '2f': return renderFloor2Plan(ctx, canEnter);
    case '1f': return renderFloor1Plan(ctx, canEnter);
    case 'ground': return renderGroundPlan(ctx, canEnter);
    default: return '';
  }
}

export function renderCorridorView(ctx: MapContext, renderEndDayPanel: (isOutOfStamina: boolean) => string): string {
  const currentFloor = getFloorFromLocation(ctx.state.currentLocation);
  const isCorridorTimeUp = ctx.state.currentTime >= MAX_TIME;
  const isOutOfStamina = ctx.state.stamina <= 0 || isCorridorTimeUp;
  const canEnter = !isCorridorTimeUp && ctx.state.stamina >= MOVE_COST.ENTER_ROOM;

  const endDayHtml = renderEndDayPanel(isOutOfStamina);

  return `
    <div class="game-panel" style="
      padding:10px; margin-bottom:12px;
    ">
      ${renderFloorPlan(ctx, currentFloor, canEnter)}
    </div>

    <div class="daily-mobile-actions">
      <div class="game-panel" style="
        padding:12px 14px; margin-bottom:12px;
      ">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button id="info-btn" class="game-btn" style="
            padding:10px 12px;
            background:linear-gradient(180deg,#8E6BAD,#6E4B8D);
            border-color:#a080c0;
            font-size:0.85em;
            text-align:left; font-family:var(--game-font);
          ">
            <div style="font-weight:bold;">情報</div>
            <div style="font-size:0.75em; opacity:0.85;">クラス・部活</div>
          </button>
          <button id="next-day-btn-always" class="game-btn game-btn-warning" style="
            padding:10px 12px;
            font-size:0.85em;
            text-align:left; font-family:var(--game-font);
          ">
            <div style="font-weight:bold;">翌日へ</div>
            <div style="font-size:0.75em; opacity:0.85;">${dayToDate(ctx.state.day)}</div>
          </button>
        </div>
      </div>
    </div>

    ${endDayHtml}
  `;
}
