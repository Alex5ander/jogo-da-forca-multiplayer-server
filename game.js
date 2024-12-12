export default class Game {
  /** @param {{value:string; hint:string}} word  */
  constructor(word) {
    this.word = word;
    this.errors = 0;
    this.correctLetters = Array(word.value.length).fill('');
    this.usedLetters = [];
    this.score = 0;
  }
  /** @param {string} letter  */
  useLetter(letter) {
    if (!this.isEnd()) {
      this.usedLetters.push(letter);
      if (this.word.value.search(letter) != -1) {
        const regexp = new RegExp(letter, 'g');
        const regexpstringInterator = this.word.value.matchAll(regexp);
        let data;
        while (!(data = regexpstringInterator.next()).done) {
          const index = data.value['index'];
          this.correctLetters[index] = letter;
        }
      } else {
        this.errors += 1;
      }
    }
  }
  /** @param {{value:string; hint:string}} word  */
  restart(word) {
    this.score += 1;
    this.word = word;
    this.errors = 0;
    this.correctLetters = Array(word.value.length).fill('');
    this.usedLetters = [];
  }
  isWin() {
    return this.correctLetters.join('') == this.word.value.replace(/\s/g, '');
  }
  isEnd() {
    return this.isWin() || this.errors == 6
  }
}