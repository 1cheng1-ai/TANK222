export interface Vec2 {
  x: number;
  y: number;
}

export interface GridPos {
  col: number;
  row: number;
}

declare const __TANK_ID_BRAND: unique symbol;
declare const __BULLET_ID_BRAND: unique symbol;

export type TankId = number & { readonly [__TANK_ID_BRAND]: true };
export type BulletId = number & { readonly [__BULLET_ID_BRAND]: true };

let tankIdCounter = 0;
let bulletIdCounter = 0;

export function createTankId(): TankId {
  tankIdCounter += 1;
  return tankIdCounter as TankId;
}

export function createBulletId(): BulletId {
  bulletIdCounter += 1;
  return bulletIdCounter as BulletId;
}

export function resetIds(): void {
  tankIdCounter = 0;
  bulletIdCounter = 0;
}