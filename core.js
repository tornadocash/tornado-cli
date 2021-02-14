const fs = require('fs')
const crypto = require('crypto')
const circomlib = require('circomlib')
const websnarkUtils = require('websnark/src/utils')
const MerkleTree = require('fixed-merkle-tree')
const circuit = require('./build/circuits/tornado.json')
const path = require('path')
const proving_key = fs.readFileSync(path.resolve(__dirname, './build/circuits/tornadoProvingKey.bin')).buffer
const buildGroth16 = require('websnark/src/groth16')
const snarkjs = require('snarkjs')
const { toBN } = require('web3-utils')
const bigInt = snarkjs.bigInt
let groth16, MERKLE_TREE_HEIGHT

/** Generate random number of specified byte length */
const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes))

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  const str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16)
  return '0x' + str.padStart(length * 2, '0')
}

/** Compute pedersen hash */
const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0]

/**
 * Create deposit object from secret and nullifier
 */
function createDeposit({ nullifier, secret } = {}) {
  if (!nullifier && !secret) {
    nullifier = rbigint(31)
    secret = rbigint(31)
  }
  const deposit = { nullifier: bigInt(nullifier), secret: bigInt(secret) }
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)])
  deposit.commitment = pedersenHash(deposit.preimage)
  deposit.commitmentHex = toHex(deposit.commitment)
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31))
  deposit.nullifierHex = toHex(deposit.nullifierHash)
  return deposit
}

/**
 * Generate merkle tree for a deposit.
 * @param deposit Deposit object
 */
function generateMerkleProof({ deposit, events }) {
  let leafIndex = -1

  let argsProperty
  if (events[0].returnValues) {
    argsProperty = 'returnValues'
  } else if (events[0].args) {
    argsProperty = 'args'
  } else {
    throw new Error('Only implemented for web3 and ethersjs')
  }

  const leaves = events
    .sort((a, b) => a[argsProperty].leafIndex - b[argsProperty].leafIndex) // Sort events in chronological order
    .map((e) => {
      const index = toBN(e[argsProperty].leafIndex).toNumber()

      if (toBN(e[argsProperty].commitment).eq(toBN(deposit.commitmentHex))) {
        leafIndex = index
      }
      return e[argsProperty].commitment.toString(10)
    })

  const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves)

  // Compute merkle proof of our commitment
  const { pathIndices, pathElements } = tree.path(leafIndex)
  return {
    pathElements,
    pathIndices,
    root: tree.root()
  }
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateProof({ deposit, recipient, events, relayerAddress = 0, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment
  const { root, pathElements, pathIndices } = generateMerkleProof({ deposit, events })

  // Prepare circuit input
  const input = {
    // Public snark inputs
    root: root,
    nullifierHash: deposit.nullifierHash,
    recipient: bigInt(recipient),
    relayer: bigInt(relayerAddress),
    fee: bigInt(fee),
    refund: bigInt(refund),

    // Private snark inputs
    nullifier: deposit.nullifier,
    secret: deposit.secret,
    pathElements,
    pathIndices
  }

  console.log('Generating SNARK proof')
  console.time('Proof time')
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key)
  const { proof } = websnarkUtils.toSolidityInput(proofData)
  console.timeEnd('Proof time')

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund)
  ]

  return { proof, args }
}

async function initialize({ merkleTreeHeight }) {
  MERKLE_TREE_HEIGHT = merkleTreeHeight
  groth16 = await buildGroth16()
}

module.exports = {
  initialize,
  createDeposit,
  generateProof,
  generateMerkleProof,
  rbigint,
  bigInt,
  toHex,
  pedersenHash
}
