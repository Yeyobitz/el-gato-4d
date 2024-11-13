# Multiuniversal Gato (4D Tic-Tac-Toe)

A 4D twist on the classic Tic-Tac-Toe game, implemented in JavaScript. Challenge yourself against another player or test your skills against an AI with adjustable difficulty levels.

## Try it Out

You can play the game directly in your browser at [https://multiuniversalgato.netlify.app/](https://multiuniversalgato.netlify.app/).

## Features

- **Multiplayer Mode**: Play against another human player on the same device.
- **Single-Player Mode**: Compete against an AI opponent with three difficulty levels: Easy, Medium, and Hard.
- **Dynamic Gameplay**: Each move affects not just the mini-board but also dictates where the next move must be played.
- **Retro Aesthetics**: Enjoy a nostalgic design with pixelated fonts and starry backgrounds.
- **Audio Experience**: Immerse yourself with background music and sound effects (toggleable).

## How to Play

The game consists of a main board with 9 mini-boards (a 3x3 grid), each of which is a Tic-Tac-Toe board.

- **Objective**: Win three mini-boards in a row on the main board (horizontal, vertical, or diagonal) or control more mini-boards than your opponent when the game ends.
- **Starting the Game**: Player 'X' begins and can play in any cell of any mini-board.
- **Rule of Sending**: The cell you choose dictates the mini-board where your opponent must play next. For example, if you place your symbol in the top-left cell, your opponent must play in the top-left mini-board.
- **Winning a Mini-Board**: Get three of your symbols in a row within a mini-board to win it.
- **Occupied Mini-Boards**: If the directed mini-board is full or already won, the next player can choose any available mini-board.
- **Ending the Game**: The game ends when a player wins three mini-boards in a row or when all mini-boards are filled.

For detailed rules and visual examples, refer to the in-game instructions.

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/multiuniversal-gato.git
   ```

2. **Navigate to the Project Directory**

   ```bash
   cd multiuniversal-gato
   ```

3. **Launch the Game**

   Open the `index.html` file in your preferred web browser.

   - **Option 1**: Double-click the `index.html` file.
   - **Option 2**: Right-click `index.html` and select "Open with" followed by your browser choice.

## Dependencies

- The game is built with pure HTML, CSS, and JavaScript.
- No external libraries or installations are required.


## Controls

- **Mouse**: Click on the desired cell to place your symbol.
- **Keyboard Shortcuts**:
- **Pause/Resume Game**: Press `P`, `Esc`, or `Spacebar`.

## Audio Settings

- Adjust the background music volume in the pause menu.
- Skip, play, or pause tracks using the music controls.

## Contributing

Contributions are welcome! If you have suggestions or find bugs, please open an issue or submit a pull request.

1. **Fork the Repository**
2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add YourFeature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Open a Pull Request**

## License

This project is open-source and available under the MIT License.

## Acknowledgments

- Inspired by the classic game of Tic-Tac-Toe (El Gato).
- Retro fonts by [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P).

## Contact

Created by [@Yeyobitz](https://yeyobitz.dev). Feel free to reach out for questions, suggestions, or collaborations.

---

*¡Disfruta del juego y desafía tus habilidades estratégicas en este multiversal desafío!*