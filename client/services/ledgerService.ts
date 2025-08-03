
import { Game, PlayerLedger, GameStatus } from '../types';

export const calculateRollover = (games: Game[]): number => {
  let rollover = 0;
  // Ensure games are processed in the order they were created
  const sortedGames = [...games].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const game of sortedGames) {
    if (game.status === GameStatus.IN_PROGRESS) {
      // In-progress games don't contribute to the final rollover yet.
      continue;
    }
    
    if (game.status === GameStatus.DRAW) {
      // Add this game's total pot (its own buy-ins + any previous rollover it included) to the running total.
      rollover += game.players.length * game.buyInAmount + game.potRollover;
    } else if (game.status === GameStatus.COMPLETED) {
      // A completed game consumes the entire rollover chain up to that point. The chain resets.
      rollover = 0;
    }
  }

  return rollover;
};

export const calculateLedger = (games: Game[]): PlayerLedger => {
  const ledger: PlayerLedger = {};

  const allPlayers = new Set<string>();
  games.forEach(game => game.players.forEach(p => allPlayers.add(p)));

  allPlayers.forEach(player => ledger[player] = 0);

  // Sort games chronologically to process transactions in order
  const sortedGames = [...games].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  sortedGames.forEach(game => {
    if (game.status === GameStatus.IN_PROGRESS) return;

    // Everyone pays the buy-in for every completed or drawn game
    game.players.forEach(player => {
      ledger[player] -= game.buyInAmount;
    });

    if (game.status === GameStatus.COMPLETED && game.winner) {
      const pot = game.players.length * game.buyInAmount + game.potRollover;
      let winnerTotal = pot;
      
      if (game.penalizedPlayers && game.penalizedPlayers.length > 0) {
        const penalty = game.buyInAmount * 0.5;
        game.penalizedPlayers.forEach(penalizedPlayer => {
          // Ensure penalized player exists in ledger before debiting
          if(ledger[penalizedPlayer] !== undefined) {
            ledger[penalizedPlayer] -= penalty;
          }
        });
        winnerTotal += game.penalizedPlayers.length * penalty;
      }
      
      // Ensure winner exists in ledger before crediting
      if(ledger[game.winner] !== undefined) {
        ledger[game.winner] += winnerTotal;
      }
    }
  });

  return ledger;
};