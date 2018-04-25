const BN = require('bn.js')
const { distance, mine } = require('./miner')
const { blake2bl } = require('../utils/crypto')

thread.on('mine', function (currentTimestamp, work, minerKey, merkleRoot, difficulty) { // eslint-disable-line no-undef
  console.log('======================> thread work starting')
  const solution = mine(
    currentTimestamp,
    work,
    minerKey,
    merkleRoot,
    difficulty
  )
  // $FlowFixMe
  thread.emit('data', solution) // eslint-disable-line no-undef
})
