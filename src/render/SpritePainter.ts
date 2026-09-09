import type { Faction } from '@/types/common';
import type { Vec2 } from '@/types/geometry';

export interface PaintContext {
  ctx: CanvasRenderingContext2D;
  cellSize: number;
}

const FACTION_COLORS: Record<Faction, { body: string; detail: string; track: string }> = {
  player1: { body: '#3b82f6', detail: '#dbeafe', track: '#1e3a8a' },
  player2: { body: '#22c55e', detail: '#dcfce7', track: '#14532d' },
  computer: { body: '#ef4444', detail: '#fee2e2', track: '#7f1d1d' }
};

function rotate(ctx: CanvasRenderingContext2D, cx: number, cy: number, direction: string): void {
  let angle = 0;
  switch (direction) {
    case 'up':
      angle = -Math.PI / 2;
      break;
    case 'down':
      angle = Math.PI / 2;
      break;
    case 'left':
      angle = Math.PI;
      break;
    case 'right':
      angle = 0;
      break;
  }
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
}

export class SpritePainter {
  paintTank(
    p: PaintContext,
    center: Vec2,
    direction: string,
    faction: Faction,
    hpRatio: number
  ): void {
    const { ctx, cellSize } = p;
    const cx = center.x;
    const cy = center.y;
    const half = cellSize * 0.42;
    const colors = FACTION_COLORS[faction];

    ctx.save();
    rotate(ctx, cx, cy, direction);

    ctx.fillStyle = colors.track;
    ctx.fillRect(cx - half, cy - half * 0.85, half * 0.35, half * 1.7);
    ctx.fillRect(cx + half * 0.65, cy - half * 0.85, half * 0.35, half * 1.7);

    ctx.fillStyle = colors.body;
    ctx.fillRect(cx - half * 0.75, cy - half * 0.75, half * 1.5, half * 1.5);

    ctx.fillStyle = colors.detail;
    ctx.fillRect(cx - half * 0.4, cy - half * 0.4, half * 0.8, half * 0.8);

    ctx.fillStyle = colors.body;
    ctx.fillRect(cx - half * 0.15, cy - half, half * 0.3, half * 0.6);

    ctx.fillStyle = colors.detail;
    ctx.fillRect(cx - half * 0.12, cy - half * 1.05, half * 0.24, half * 0.18);

    ctx.restore();

    if (hpRatio < 1) {
      const barW = cellSize * 0.7;
      const barH = cellSize * 0.08;
      const bx = cx - barW / 2;
      const by = cy - cellSize * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(bx, by, barW * hpRatio, barH);
    }
  }

  paintBullet(p: PaintContext, center: Vec2, faction: Faction): void {
    const { ctx, cellSize } = p;
    const r = cellSize * 0.12;
    ctx.fillStyle = faction === 'computer' ? '#fca5a5' : '#fde68a';
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  paintBrick(p: PaintContext, x: number, y: number): void {
    const { ctx, cellSize } = p;
    const w = cellSize;
    const h = cellSize;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#b45309';
    const bw = w / 2;
    const bh = h / 4;
    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let col = -1; col < 3; col++) {
        const bx = x + col * bw + offset;
        const by = y + row * bh;
        if (bx + bw > x && bx < x + w) {
          ctx.fillRect(Math.max(bx, x), by, Math.min(bx + bw, x + w) - Math.max(bx, x), bh - 1);
        }
      }
    }
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  paintSteel(p: PaintContext, x: number, y: number): void {
    const { ctx, cellSize } = p;
    const w = cellSize;
    const h = cellSize;
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#e5e7eb');
    grad.addColorStop(0.5, '#9ca3af');
    grad.addColorStop(1, '#4b5563');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + w - 2, y + 2);
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + h - 2);
    ctx.stroke();
  }

  paintBase(p: PaintContext, x: number, y: number, faction: Faction, destroyed: boolean): void {
    const { ctx, cellSize } = p;
    const w = cellSize;
    const h = cellSize;
    if (destroyed) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
      return;
    }
    const colors = FACTION_COLORS[faction];
    ctx.fillStyle = colors.track;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = colors.body;
    const flagW = w * 0.5;
    const flagH = h * 0.5;
    ctx.fillRect(x + (w - flagW) / 2, y + h * 0.15, flagW, flagH);
    ctx.fillStyle = colors.detail;
    ctx.fillRect(x + w * 0.3, y + h * 0.65, w * 0.4, h * 0.2);
  }

  paintExplosion(p: PaintContext, center: Vec2, progress: number, maxRadius: number): void {
    const { ctx, cellSize } = p;
    const radius = cellSize * maxRadius * (0.3 + progress * 0.7);
    const alpha = 1 - progress;
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(
      center.x,
      center.y,
      0,
      center.x,
      center.y,
      radius
    );
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.4, '#f97316');
    grad.addColorStop(1, 'rgba(127,29,29,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  paintTerrain(p: PaintContext, cols: number, rows: number): void {
    const { ctx, cellSize } = p;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
    ctx.strokeStyle = 'rgba(30,58,138,0.08)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellSize + 0.5, 0);
      ctx.lineTo(c * cellSize + 0.5, rows * cellSize);
      ctx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellSize + 0.5);
      ctx.lineTo(cols * cellSize, r * cellSize + 0.5);
      ctx.stroke();
    }
  }
}

export const spritePainter = new SpritePainter();