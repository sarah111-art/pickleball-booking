import { useEffect, useMemo, useReducer, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  createInitialState,
  setNextDirection,
  stepGame,
  togglePause,
  type Direction,
  type GameState,
} from "@/lib/snake";

const BOARD_SIZE = 20;
const TICK_MS = 140;

type Action =
  | { type: "tick" }
  | { type: "direction"; direction: Direction }
  | { type: "toggle_pause" }
  | { type: "restart" };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "tick":
      return stepGame(state);
    case "direction":
      return setNextDirection(state, action.direction);
    case "toggle_pause":
      return togglePause(state);
    case "restart":
      return createInitialState(state.width, state.height);
    default:
      return state;
  }
};

const Snake = () => {
  const initialState = useMemo(() => createInitialState(BOARD_SIZE, BOARD_SIZE), []);
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<number | null>(null);

  const cells = useMemo(() => {
    return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({
      x: index % BOARD_SIZE,
      y: Math.floor(index / BOARD_SIZE),
    }));
  }, []);

  useEffect(() => {
    if (state.status === "running") {
      intervalRef.current = window.setInterval(() => dispatch({ type: "tick" }), TICK_MS);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [state.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "r"].includes(key)) {
        event.preventDefault();
      }

      if (key === " " || key === "p") {
        dispatch({ type: "toggle_pause" });
        return;
      }

      if (key === "r") {
        dispatch({ type: "restart" });
        return;
      }

      const directionMap: Record<string, Direction> = {
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right",
      };

      const nextDirection = directionMap[key];
      if (nextDirection) {
        dispatch({ type: "direction", direction: nextDirection });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const snakeSet = useMemo(() => {
    return new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  }, [state.snake]);

  const head = state.snake[0];
  const headKey = `${head.x},${head.y}`;
  const foodKey = state.food ? `${state.food.x},${state.food.y}` : null;

  const statusLabel =
    state.status === "gameover" ? "Game Over" : state.status === "won" ? "You Win" : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container px-4">
          <div className="flex flex-col gap-6 items-center">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold">Snake</h1>
              <p className="text-sm text-muted-foreground">
                Dùng phím mũi tên hoặc WASD. Nhấn Space để tạm dừng, R để chơi lại.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="text-sm font-medium">Score: {state.score}</div>
              <Button variant="outline" size="sm" onClick={() => dispatch({ type: "toggle_pause" })}>
                {state.status === "paused" ? "Resume" : "Pause"}
              </Button>
              <Button variant="default" size="sm" onClick={() => dispatch({ type: "restart" })}>
                Restart
              </Button>
            </div>

            <div className="relative">
              <div className="rounded-xl border border-border bg-border p-2">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                    width: "min(80vw, 420px)",
                  }}
                >
                  {cells.map((cell) => {
                    const key = `${cell.x},${cell.y}`;
                    const isHead = key === headKey;
                    const isSnake = snakeSet.has(key);
                    const isFood = foodKey === key;
                    const baseClass = "aspect-square rounded-sm";
                    const cellClass = isHead
                      ? "bg-primary"
                      : isSnake
                        ? "bg-primary/70"
                        : isFood
                          ? "bg-destructive"
                          : "bg-background";

                    return <div key={key} className={`${baseClass} ${cellClass}`} />;
                  })}
                </div>
              </div>

              {(state.status === "gameover" || state.status === "won") && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
                  <div className="text-center space-y-3">
                    <div className="text-xl font-semibold">{statusLabel}</div>
                    <Button size="sm" onClick={() => dispatch({ type: "restart" })}>
                      Play Again
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 w-[160px]">
              <div />
              <Button
                variant="outline"
                size="icon"
                aria-label="Move up"
                onClick={() => dispatch({ type: "direction", direction: "up" })}
              >
                ↑
              </Button>
              <div />
              <Button
                variant="outline"
                size="icon"
                aria-label="Move left"
                onClick={() => dispatch({ type: "direction", direction: "left" })}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Move down"
                onClick={() => dispatch({ type: "direction", direction: "down" })}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Move right"
                onClick={() => dispatch({ type: "direction", direction: "right" })}
              >
                →
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Snake;
