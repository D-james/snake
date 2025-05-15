"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export default function SnakeGame() {
  const GRID_SIZE = 20;
  const CELL_SIZE = 20;
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const directionRef = useRef("RIGHT");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      generateFood();
      return;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    directionRef.current = "RIGHT";
    setGameOver(false);
    setScore(0);
    generateFood();
  }, [generateFood]);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }
    setGameStarted(true);
    setError("");
    generateFood();
  };

  const saveScore = async () => {
    try {
      const response = await fetch("/api/saveScore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_name: playerName,
          score: score
        }),
      });
      if (!response.ok) throw new Error("Failed to save score");
    } catch (error) {
      console.error("Error saving score:", error);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        if (directionRef.current !== "DOWN") directionRef.current = "UP";
        break;
      case "ArrowDown":
        if (directionRef.current !== "UP") directionRef.current = "DOWN";
        break;
      case "ArrowLeft":
        if (directionRef.current !== "RIGHT") directionRef.current = "LEFT";
        break;
      case "ArrowRight":
        if (directionRef.current !== "LEFT") directionRef.current = "RIGHT";
        break;
    }
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    document.addEventListener("keydown", handleKeyDown);
    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (directionRef.current) {
          case "UP":
            head.y -= 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
        }

        const isGameOver = 
          head.x < 0 || head.x >= GRID_SIZE ||
          head.y < 0 || head.y >= GRID_SIZE ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y);

        if (isGameOver) {
          setGameOver(true);
          if (!gameOver) {
            saveScore();
          }
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 150);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(gameLoop);
    };
  }, [gameStarted, gameOver, food, generateFood, handleKeyDown]);

  useEffect(() => {
    if (!gameStarted || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(
      food.x * CELL_SIZE,
      food.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? 'darkgreen' : 'green';
      ctx.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
      );
    });
  }, [snake, food, gameStarted, gameOver]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!gameStarted ? (
        <form onSubmit={handleStartGame} className="space-y-4 w-full max-w-md">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 border rounded"
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Game
          </button>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Player: {playerName}</h1>
          <p className="text-xl">Score: {score}</p>
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            className="border border-gray-300 bg-white"
          />
          {gameOver && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded flex flex-col items-center">
              <p className="text-2xl mb-2">Game Over!</p>
              <p className="mb-4">Final Score: {score}</p>
              <button
                onClick={() => {
                  resetGame();
                  setGameStarted(true);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
