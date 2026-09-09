import type { GridPos, Vec2 } from '@/types/geometry';

export class Camera {
  cols: number;
  rows: number;
  pixelWidth: number;
  pixelHeight: number;
  private offsetX: number;
  private offsetY: number;
  private cellSize: number;

  constructor(cols: number, rows: number, pixelWidth: number, pixelHeight: number) {
    this.cols = cols;
    this.rows = rows;
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;
    this.recompute();
  }

  private recompute(): void {
    const sizeByW = this.pixelWidth / this.cols;
    const sizeByH = this.pixelHeight / this.rows;
    this.cellSize = Math.max(1, Math.min(sizeByW, sizeByH));
    const totalW = this.cellSize * this.cols;
    const totalH = this.cellSize * this.rows;
    this.offsetX = (this.pixelWidth - totalW) / 2;
    this.offsetY = (this.pixelHeight - totalH) / 2;
  }

  resize(pixelWidth: number, pixelHeight: number): void {
    this.pixelWidth = pixelWidth;
    this.pixelHeight = pixelHeight;
    this.recompute();
  }

  getCellSize(): number {
    return this.cellSize;
  }

  logicalToPixel(p: Vec2): { x: number; y: number } {
    return {
      x: this.offsetX + p.x * this.cellSize,
      y: this.offsetY + p.y * this.cellSize
    };
  }

  gridToPixel(g: GridPos): { x: number; y: number } {
    return {
      x: this.offsetX + g.col * this.cellSize,
      y: this.offsetY + g.row * this.cellSize
    };
  }
}