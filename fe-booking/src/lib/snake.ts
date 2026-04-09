export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "running" | "paused" | "gameover" | "won";

export type GameState = {
  width: number;
  height: number;
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point | null;
  score: number;
  status: GameStatus;
  tick: number;
};

export type Rng = () => number;

const DIRECTION_VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const arePointsEqual = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

const pointKey = (point: Point) => `${point.x},${point.y}`;

const isOppositeDirection = (current: Direction, next: Direction) => {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
};

const getEmptyCells = (width: number, height: number, snake: Point[]) => {
  const occupied = new Set(snake.map(pointKey));
  const empty: Point[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = { x, y };
      if (!occupied.has(pointKey(cell))) {
        empty.push(cell);
      }
    }
  }
  return empty;
};

const placeFood = (width: number, height: number, snake: Point[], rng: Rng): Point | null => {
  const emptyCells = getEmptyCells(width, height, snake);
  if (emptyCells.length === 0) return null;
  const choice = Math.floor(rng() * emptyCells.length);
  return emptyCells[choice];
};

export const createInitialState = (width: number, height: number, rng: Rng = Math.random): GameState => {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const snake: Point[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  return {
    width,
    height,
    snake,
    direction: "right",
    nextDirection: "right",
    food: placeFood(width, height, snake, rng),
    score: 0,
    status: "running",
    tick: 0,
  };
};

export const setNextDirection = (state: GameState, next: Direction): GameState => {
  if (state.status !== "running" && state.status !== "paused") {
    return state;
  }
  if (isOppositeDirection(state.direction, next)) {
    return state;
  }
  return { ...state, nextDirection: next };
};

export const togglePause = (state: GameState): GameState => {
  if (state.status === "gameover" || state.status === "won") {
    return state;
  }
  return { ...state, status: state.status === "paused" ? "running" : "paused" };
};

export const stepGame = (state: GameState, rng: Rng = Math.random): GameState => {
  if (state.status !== "running") {
    return state;
  }

  const vector = DIRECTION_VECTORS[state.nextDirection];
  const currentHead = state.snake[0];
  const nextHead = { x: currentHead.x + vector.x, y: currentHead.y + vector.y };

  const hitWall = nextHead.x < 0 || nextHead.x >= state.width || nextHead.y < 0 || nextHead.y >= state.height;
  if (hitWall) {
    return { ...state, status: "gameover" };
  }

  const willGrow = state.food ? arePointsEqual(nextHead, state.food) : false;
  const bodyToCheck = willGrow ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some((segment) => arePointsEqual(segment, nextHead))) {
    return { ...state, status: "gameover" };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) {
    nextSnake.pop();
  }

  let nextFood = state.food;
  let nextScore = state.score;
  let nextStatus: GameStatus = state.status;

  if (willGrow) {
    nextScore += 1;
    nextFood = placeFood(state.width, state.height, nextSnake, rng);
    if (!nextFood) {
      nextStatus = "won";
    }
  }

  return {
    ...state,
    snake: nextSnake,
    direction: state.nextDirection,
    nextDirection: state.nextDirection,
    food: nextFood,
    score: nextScore,
    status: nextStatus,
    tick: state.tick + 1,
  };
};
