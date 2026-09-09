import type { Faction } from '@/types/common';
import type { GridPos } from '@/types/geometry';

export class Base {
  readonly faction: Faction;
  readonly position: GridPos;
  destroyed: boolean;

  constructor(faction: Faction, position: GridPos) {
    this.faction = faction;
    this.position = { ...position };
    this.destroyed = false;
  }

  destroy(): void {
    this.destroyed = true;
  }
}