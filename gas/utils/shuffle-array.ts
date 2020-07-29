/**
 * Shuffle Array - JavaScript ES2015, ES6
 *  https://gist.github.com/guilhermepontes/17ae0cc71fa2b13ea8c20c94c5c35dc4
 */

const shuffleArray = <T>(arr: T[]) => arr
  .map(i => ({ i, r: Math.random() }))
  .sort((a, b) => a.r - b.r)
  .map(a => a.i)

export { shuffleArray }
