import type { MapConfig } from './types';

function brick(col: number, row: number) {
  return { pos: { col, row }, type: 'brick' as const };
}

function steel(col: number, row: number) {
  return { pos: { col, row }, type: 'steel' as const };
}

function buildSymmetricObstacles(): MapConfig['obstacles'] {
  const obstacles: MapConfig['obstacles'] = [];
  const cols = 26;
  const rows = 26;

  for (let row = 4; row < 22; row += 2) {
    for (let col = 4; col < 22; col += 2) {
      if ((row + col) % 4 === 0) {
        obstacles.push(brick(col, row));
        obstacles.push(brick(col + 1, row));
        obstacles.push(brick(col, row + 1));
        obstacles.push(brick(col + 1, row + 1));
      }
    }
  }

  obstacles.push(steel(12, 6), steel(13, 6), steel(12, 7), steel(13, 7));
  obstacles.push(steel(12, 18), steel(13, 18), steel(12, 19), steel(13, 19));

  obstacles.push(brick(6, 12), brick(6, 13), brick(7, 12), brick(7, 13));
  obstacles.push(brick(18, 12), brick(18, 13), brick(19, 12), brick(19, 13));

  void cols;
  void rows;
  return obstacles;
}

function buildBaseGuard(col: number, row: number): MapConfig['obstacles'] {
  return [
    brick(col - 1, row - 1),
    brick(col, row - 1),
    brick(col + 1, row - 1),
    brick(col - 1, row),
    brick(col + 1, row),
    steel(col - 1, row + 1),
    steel(col, row + 1),
    steel(col + 1, row + 1)
  ];
}

export const mapConfig: MapConfig = {
  cols: 26,
  rows: 26,
  obstacles: [
    ...buildSymmetricObstacles(),
    ...buildBaseGuard(1, 24),
    ...buildBaseGuard(24, 24),
    ...buildBaseGuard(13, 1)
  ],
  tanks: [
    { faction: 'player1', pos: { col: 1, row: 24 } },
    { faction: 'player2', pos: { col: 24, row: 24 } },
    { faction: 'computer', pos: { col: 13, row: 1 } }
  ],
  bases: [
    { faction: 'player1', pos: { col: 1, row: 24 } },
    { faction: 'player2', pos: { col: 24, row: 24 } },
    { faction: 'computer', pos: { col: 13, row: 1 } }
  ]
};