#!/usr/bin/env node
// Works both in browser and node.js

require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const assert = require('assert');
const snarkjs = require('snarkjs');
const crypto = require('crypto');
const circomlib = require('circomlib');
const bigInt = snarkjs.bigInt;
const merkleTree = require('fixed-merkle-tree');
const Web3 = require('web3');
const Web3HttpProvider = require('web3-providers-http');
const buildGroth16 = require('websnark/src/groth16');
const websnarkUtils = require('websnark/src/utils');
const { toWei, fromWei, toBN, BN } = require('web3-utils');
const BigNumber = require('bignumber.js');
const config = require('./config');
const program = require('commander');
const { GasPriceOracle } = require('gas-price-oracle');
const SocksProxyAgent = require('socks-proxy-agent');
const is_ip_private = require('private-ip');

let web3, torPort, tornado, tornadoContract, tornadoInstance, circuit, proving_key, groth16, erc20, senderAccount, netId, netName, netSymbol, doNotSubmitTx, multiCall, privateRpc, subgraph;
let MERKLE_TREE_HEIGHT, ETH_AMOUNT, TOKEN_AMOUNT, PRIVATE_KEY;

/** Whether we are in a browser or node.js */
const inBrowser = typeof window !== 'undefined';
let isTestRPC = false;

/** Generate random number of specified byte length */
const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes));

/** Compute pedersen hash */
const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];

/** BigNumber to hex string of specified length */
function toHex(number, length = 32) {
  const str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16);
  return '0x' + str.padStart(length * 2, '0');
}

/** Remove Decimal without rounding with BigNumber */
function rmDecimalBN(bigNum, decimals = 6) {
  return new BigNumber(bigNum).times(BigNumber(10).pow(decimals)).integerValue(BigNumber.ROUND_DOWN).div(BigNumber(10).pow(decimals)).toNumber();
}

/** Use MultiCall Contract */
async function useMultiCall(queryArray) {
  const multiCallABI = require('./build/contracts/Multicall.abi.json');
  const multiCallContract = new web3.eth.Contract(multiCallABI, multiCall);
  const { returnData } = await multiCallContract.methods.aggregate(queryArray).call();
  return returnData;
}

/** Display ETH account balance */
async function printETHBalance({ address, name }) {
  const checkBalance = new BigNumber(await web3.eth.getBalance(address)).div(BigNumber(10).pow(18));
  console.log(`${name} balance is`, rmDecimalBN(checkBalance), `${netSymbol}`);
}

/** Display ERC20 account balance */
async function printERC20Balance({ address, name, tokenAddress }) {
  let tokenDecimals, tokenBalance, tokenName, tokenSymbol;
  const erc20ContractJson = require('./build/contracts/ERC20Mock.json');
  erc20 = tokenAddress ? new web3.eth.Contract(erc20ContractJson.abi, tokenAddress) : erc20;
  if (!isTestRPC && !multiCall) {
    const tokenCall = await useMultiCall([[tokenAddress, erc20.methods.balanceOf(address).encodeABI()], [tokenAddress, erc20.methods.decimals().encodeABI()], [tokenAddress, erc20.methods.name().encodeABI()], [tokenAddress, erc20.methods.symbol().encodeABI()]]);
    tokenDecimals = parseInt(tokenCall[1]);
    tokenBalance = new BigNumber(tokenCall[0]).div(BigNumber(10).pow(tokenDecimals));
    tokenName = web3.eth.abi.decodeParameter('string', tokenCall[2]);
    tokenSymbol = web3.eth.abi.decodeParameter('string', tokenCall[3]);
  } else {
    tokenDecimals = await erc20.methods.decimals().call();
    tokenBalance = new BigNumber(await erc20.methods.balanceOf(address).call()).div(BigNumber(10).pow(tokenDecimals));
    tokenName = await erc20.methods.name().call();
    tokenSymbol = await erc20.methods.symbol().call();
  }
  console.log(`${name}`, tokenName, `Balance is`, rmDecimalBN(tokenBalance), tokenSymbol);
}

async function submitTransaction(signedTX) {
  console.log("Submitting transaction to the remote node");
  await web3.eth.sendSignedTransaction(signedTX)
    .on('transactionHash', function (txHash) {
      console.log(`View transaction on block explorer https://${getExplorerLink()}/tx/${txHash}`);
    })
    .on('error', function (e) {
      console.error('on transactionHash error', e.message);
    });
}

async function generateTransaction(to, encodedData, value = 0) {
  const nonce = await web3.eth.getTransactionCount(senderAccount);
  let gasPrice = await fetchGasPrice();
  let gasLimit;

  async function estimateGas() {
    const fetchedGas = await web3.eth.estimateGas({
      from  : senderAccount,
      to    : to,
      value : value,
      nonce : nonce,
      data  : encodedData
    });
    const bumped = Math.floor(fetchedGas * 1.3);
    return web3.utils.toHex(bumped);
  }
  if (encodedData) {
    gasLimit = await estimateGas();
  } else {
    gasLimit = web3.utils.toHex(21000);
  }

  function txoptions() {
    // Generate EIP-1559 transaction
    if (netId == 1) {
      return {
        to                   : to,
        value                : value,
        nonce                : nonce,
        maxFeePerGas         : gasPrice,
        maxPriorityFeePerGas : web3.utils.toHex(web3.utils.toWei('3', 'gwei')),
        gas                  : gasLimit,
        data                 : encodedData
      }
    } else if (netId == 5 || netId == 137 || netId == 43114) {
      return {
        to                   : to,
        value                : value,
        nonce                : nonce,
        maxFeePerGas         : gasPrice,
        maxPriorityFeePerGas : gasPrice,
        gas                  : gasLimit,
        data                 : encodedData
      }
    } else {
      return {
        to       : to,
        value    : value,
        nonce    : nonce,
        gasPrice : gasPrice,
        gas      : gasLimit,
        data     : encodedData
      }
    }
  }
  const tx = txoptions();
  const signed = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  if (!doNotSubmitTx) {
    await submitTransaction(signed.rawTransaction);
  } else {
    console.log('\n=============Raw TX=================', '\n');
    console.log(`Please submit this raw tx to https://${getExplorerLink()}/pushTx, or otherwise broadcast with node cli.js broadcast command.`, `\n`);
    console.log(signed.rawTransaction, `\n`);
    console.log('=====================================', '\n');
  }
}

/**
 * Create deposit object from secret and nullifier
 */
function createDeposit({ nullifier, secret }) {
  const deposit = { nullifier, secret };
  deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)]);
  deposit.commitment = pedersenHash(deposit.preimage);
  deposit.commitmentHex = toHex(deposit.commitment);
  deposit.nullifierHash = pedersenHash(deposit.nullifier.leInt2Buff(31));
  deposit.nullifierHex = toHex(deposit.nullifierHash);
  return deposit;
}

async function backupNote({ currency, amount, netId, note, noteString }) {
  try {
    await fs.writeFileSync(`./backup-tornado-${currency}-${amount}-${netId}-${note.slice(0, 10)}.txt`, noteString, 'utf8');
    console.log("Backed up deposit note as", `./backup-tornado-${currency}-${amount}-${netId}-${note.slice(0, 10)}.txt`);
  } catch (e) {
    throw new Error('Writing backup note failed:', e);
  }
}

async function backupInvoice({ currency, amount, netId, commitmentNote, invoiceString }) {
  try {
    await fs.writeFileSync(`./backup-tornadoInvoice-${currency}-${amount}-${netId}-${commitmentNote.slice(0, 10)}.txt`, invoiceString, 'utf8');
    console.log("Backed up invoice as", `./backup-tornadoInvoice-${currency}-${amount}-${netId}-${commitmentNote.slice(0, 10)}.txt`)
  } catch (e) {
    throw new Error('Writing backup invoice failed:', e)
  }
}

/**
 * create a deposit invoice.
 * @param currency Сurrency
 * @param amount Deposit amount
 */
async function createInvoice({ currency, amount, chainId }) {
  const deposit = createDeposit({
    nullifier: rbigint(31),
    secret: rbigint(31)
  });
  const note = toHex(deposit.preimage, 62);
  const noteString = `tornado-${currency}-${amount}-${chainId}-${note}`;
  console.log(`Your note: ${noteString}`);

  const commitmentNote = toHex(deposit.commitment);
  const invoiceString = `tornadoInvoice-${currency}-${amount}-${chainId}-${commitmentNote}`;
  console.log(`Your invoice for deposit: ${invoiceString}`);

  await backupNote({ currency, amount, netId: chainId, note, noteString });
  await backupInvoice({ currency, amount, netId: chainId, commitmentNote, invoiceString });

  return (noteString, invoiceString);
}

/**
 * Make a deposit
 * @param currency Сurrency
 * @param amount Deposit amount
 */
async function deposit({ currency, amount, commitmentNote }) {
  assert(senderAccount != null, 'Error! PRIVATE_KEY not found. Please provide PRIVATE_KEY in .env file if you deposit');
  let commitment, noteString;
  if (!commitmentNote) {
    console.log("Creating new random deposit note");
    const deposit = createDeposit({
      nullifier: rbigint(31),
      secret: rbigint(31)
    });
    const note = toHex(deposit.preimage, 62);
    noteString = `tornado-${currency}-${amount}-${netId}-${note}`;
    console.log(`Your note: ${noteString}`);
    await backupNote({ currency, amount, netId, note, noteString });
    commitment = toHex(deposit.commitment);
  } else {
    console.log("Using supplied invoice for deposit");
    commitment = toHex(commitmentNote);
  }
  if (currency === netSymbol.toLowerCase()) {
    await printETHBalance({ address: tornadoContract._address, name: 'Tornado contract' });
    await printETHBalance({ address: senderAccount, name: 'Sender account' });
    const value = isTestRPC ? ETH_AMOUNT : fromDecimals({ amount, decimals: 18 });
    console.log('Submitting deposit transaction');
    await generateTransaction(contractAddress, tornado.methods.deposit(tornadoInstance, commitment, []).encodeABI(), value);
    await printETHBalance({ address: tornadoContract._address, name: 'Tornado contract' });
    await printETHBalance({ address: senderAccount, name: 'Sender account' });
  } else {
    // a token
    await printERC20Balance({ address: tornadoContract._address, name: 'Tornado contract' });
    await printERC20Balance({ address: senderAccount, name: 'Sender account' });
    const decimals = isTestRPC ? 18 : config.deployments[`netId${netId}`][currency].decimals;
    const tokenAmount = isTestRPC ? TOKEN_AMOUNT : fromDecimals({ amount, decimals });
    if (isTestRPC) {
      console.log('Minting some test tokens to deposit');
      await generateTransaction(erc20Address, erc20.methods.mint(senderAccount, tokenAmount).encodeABI());
    }

    const allowance = await erc20.methods.allowance(senderAccount, tornado._address).call({ from: senderAccount });
    console.log('Current allowance is', fromWei(allowance));
    if (toBN(allowance).lt(toBN(tokenAmount))) {
      console.log('Approving tokens for deposit');
      await generateTransaction(erc20Address, erc20.methods.approve(tornado._address, tokenAmount).encodeABI());
    }

    console.log('Submitting deposit transaction');
    await generateTransaction(contractAddress, tornado.methods.deposit(tornadoInstance, commitment, []).encodeABI());
    await printERC20Balance({ address: tornadoContract._address, name: 'Tornado contract' });
    await printERC20Balance({ address: senderAccount, name: 'Sender account' });
  }

  if(!commitmentNote) {
    return noteString;
  }
}

/**
 * Generate merkle tree for a deposit.
 * Download deposit events from the tornado, reconstructs merkle tree, finds our deposit leaf
 * in it and generates merkle proof
 * @param deposit Deposit object
 */
async function generateMerkleProof(deposit, currency, amount) {
  let leafIndex = -1;
  // Get all deposit events from smart contract and assemble merkle tree from them

  const cachedEvents = await fetchEvents({ type: 'deposit', currency, amount });

  const leaves = cachedEvents
    .sort((a, b) => a.leafIndex - b.leafIndex) // Sort events in chronological order
    .map((e) => {
      const index = toBN(e.leafIndex).toNumber();

      if (toBN(e.commitment).eq(toBN(deposit.commitmentHex))) {
        leafIndex = index;
      }
      return toBN(e.commitment).toString(10);
    });
  const tree = new merkleTree(MERKLE_TREE_HEIGHT, leaves);

  // Validate that our data is correct
  const root = tree.root();
  let isValidRoot, isSpent;
  if (!isTestRPC && !multiCall) {
    const callContract = await useMultiCall([[tornadoContract._address, tornadoContract.methods.isKnownRoot(toHex(root)).encodeABI()], [tornadoContract._address, tornadoContract.methods.isSpent(toHex(deposit.nullifierHash)).encodeABI()]])
    isValidRoot = web3.eth.abi.decodeParameter('bool', callContract[0]);
    isSpent = web3.eth.abi.decodeParameter('bool', callContract[1]);
  } else {
    isValidRoot = await tornadoContract.methods.isKnownRoot(toHex(root)).call();
    isSpent = await tornadoContract.methods.isSpent(toHex(deposit.nullifierHash)).call();
  }
  assert(isValidRoot === true, 'Merkle tree is corrupted');
  assert(isSpent === false, 'The note is already spent');
  assert(leafIndex >= 0, 'The deposit is not found in the tree');

  // Compute merkle proof of our commitment
  const { pathElements, pathIndices } = tree.path(leafIndex);
  return { root, pathElements, pathIndices };
}

/**
 * Generate SNARK proof for withdrawal
 * @param deposit Deposit object
 * @param recipient Funds recipient
 * @param relayer Relayer address
 * @param fee Relayer fee
 * @param refund Receive ether for exchanged tokens
 */
async function generateProof({ deposit, currency, amount, recipient, relayerAddress = 0, fee = 0, refund = 0 }) {
  // Compute merkle proof of our commitment
  const { root, pathElements, pathIndices } = await generateMerkleProof(deposit, currency, amount);

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
    pathElements: pathElements,
    pathIndices: pathIndices
  }

  console.log('Generating SNARK proof');
  console.time('Proof time');
  const proofData = await websnarkUtils.genWitnessAndProve(groth16, input, circuit, proving_key);
  const { proof } = websnarkUtils.toSolidityInput(proofData);
  console.timeEnd('Proof time');

  const args = [
    toHex(input.root),
    toHex(input.nullifierHash),
    toHex(input.recipient, 20),
    toHex(input.relayer, 20),
    toHex(input.fee),
    toHex(input.refund)
  ];

  return { proof, args };
}

/**
 * Do an ETH withdrawal
 * @param noteString Note to withdraw
 * @param recipient Recipient address
 */
async function withdraw({ deposit, currency, amount, recipient, relayerURL, refund = '0' }) {
  let options = {};
  if (currency === netSymbol.toLowerCase() && refund !== '0') {
    throw new Error('The ETH purchase is supposted to be 0 for ETH withdrawals');
  }
  refund = toWei(refund);
  if (relayerURL) {
    if (relayerURL.endsWith('.eth')) {
      throw new Error('ENS name resolving is not supported. Please provide DNS name of the relayer. See instuctions in README.md');
    }
    if (torPort) {
      options = { httpsAgent: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' } }
    }
    const relayerStatus = await axios.get(relayerURL + '/status', options);

    const { rewardAccount, netId, ethPrices, tornadoServiceFee } = relayerStatus.data
    assert(netId === (await web3.eth.net.getId()) || netId === '*', 'This relay is for different network');
    console.log('Relay address:', rewardAccount);

    const gasPrice = await fetchGasPrice();

    const decimals = isTestRPC ? 18 : config.deployments[`netId${netId}`][currency].decimals
    const fee = calculateFee({
      currency,
      gasPrice,
      amount,
      refund,
      ethPrices,
      relayerServiceFee: tornadoServiceFee,
      decimals
    });
    if (fee.gt(fromDecimals({ amount, decimals }))) {
      throw new Error('Too high refund');
    };

    const { proof, args } = await generateProof({ deposit, currency, amount, recipient, relayerAddress: rewardAccount, fee, refund });

    console.log('Sending withdraw transaction through relay');
    try {
      const response = await axios.post(relayerURL + '/v1/tornadoWithdraw', {
        contract: tornadoInstance,
        proof,
        args
      }, options)

      const { id } = response.data;

      const result = await getStatus(id, relayerURL, options);
      console.log('STATUS', result);
    } catch (e) {
      if (e.response) {
        console.error(e.response.data.error);
      } else {
        console.error(e.message);
      }
    }
  } else {
    // using private key

    // check if the address of recepient matches with the account of provided private key from environment to prevent accidental use of deposit address for withdrawal transaction.
    assert(recipient.toLowerCase() == senderAccount.toLowerCase(), 'Withdrawal recepient mismatches with the account of provided private key from environment file');
    const checkBalance = await web3.eth.getBalance(senderAccount);
    assert(checkBalance !== 0, 'You have 0 balance, make sure to fund account by withdrawing from tornado using relayer first');

    const { proof, args } = await generateProof({ deposit, currency, amount, recipient, refund });

    console.log('Submitting withdraw transaction');
    await generateTransaction(contractAddress, tornado.methods.withdraw(tornadoInstance, proof, ...args).encodeABI());
  }
  if (currency === netSymbol.toLowerCase()) {
    await printETHBalance({ address: recipient, name: 'Recipient' });
  } else {
    await printERC20Balance({ address: recipient, name: 'Recipient' });
  }
  console.log('Done withdrawal from Tornado Cash');
}

/**
 * Do an ETH / ERC20 send
 * @param address Recepient address
 * @param amount Amount to send
 * @param tokenAddress ERC20 token address
 */
async function send({ address, amount, tokenAddress }) {
  // using private key
  assert(senderAccount != null, 'Error! PRIVATE_KEY not found. Please provide PRIVATE_KEY in .env file if you send');
  if (tokenAddress) {
    const erc20ContractJson = require('./build/contracts/ERC20Mock.json');
    erc20 = new web3.eth.Contract(erc20ContractJson.abi, tokenAddress);
    let tokenBalance, tokenDecimals, tokenSymbol;
    if (!isTestRPC && !multiCall) {
      const callToken = await useMultiCall([[tokenAddress, erc20.methods.balanceOf(senderAccount).encodeABI()], [tokenAddress, erc20.methods.decimals().encodeABI()], [tokenAddress, erc20.methods.symbol().encodeABI()]]);
      tokenBalance = new BigNumber(callToken[0]);
      tokenDecimals = parseInt(callToken[1]);
      tokenSymbol = web3.eth.abi.decodeParameter('string', callToken[2]);
    } else {
      tokenBalance = new BigNumber(await erc20.methods.balanceOf(senderAccount).call());
      tokenDecimals = await erc20.methods.decimals().call();
      tokenSymbol = await erc20.methods.symbol().call();
    }
    const toSend = new BigNumber(amount).times(BigNumber(10).pow(tokenDecimals));
    if (tokenBalance.lt(toSend)) {
      console.error("You have", rmDecimalBN(tokenBalance.div(BigNumber(10).pow(tokenDecimals))), tokenSymbol, ", you can't send more than you have");
      process.exit(1);
    }
    const encodeTransfer = erc20.methods.transfer(address, toSend).encodeABI();
    await generateTransaction(tokenAddress, encodeTransfer);
    console.log('Sent', amount, tokenSymbol, 'to', address);
  } else {
    const balance = new BigNumber(await web3.eth.getBalance(senderAccount));
    assert(balance.toNumber() !== 0, "You have 0 balance, can't send transaction");
    if (amount) {
      toSend = new BigNumber(amount).times(BigNumber(10).pow(18));
      if (balance.lt(toSend)) {
        console.error("You have", rmDecimalBN(balance.div(BigNumber(10).pow(18))), netSymbol + ", you can't send more than you have.");
        process.exit(1);
      }
    } else {
      console.log('Amount not defined, sending all available amounts');
      const gasPrice = new BigNumber(await fetchGasPrice());
      const gasLimit = new BigNumber(21000);
      if (netId == 1) {
        const priorityFee = new BigNumber(await gasPrices(3));
        toSend = balance.minus(gasLimit.times(gasPrice.plus(priorityFee)));
      } else {
        toSend = balance.minus(gasLimit.times(gasPrice));
      }
    }
    await generateTransaction(address, null, toSend);
    console.log('Sent', rmDecimalBN(toSend.div(BigNumber(10).pow(18))), netSymbol, 'to', address);
  }
}

function getStatus(id, relayerURL, options) {
  return new Promise((resolve) => {
    async function getRelayerStatus() {
      const responseStatus = await axios.get(relayerURL + '/v1/jobs/' + id, options);

      if (responseStatus.status === 200) {
        const { txHash, status, confirmations, failedReason } = responseStatus.data

        console.log(`Current job status ${status}, confirmations: ${confirmations}`);

        if (status === 'FAILED') {
          throw new Error(status + ' failed reason:' + failedReason);
        }

        if (status === 'CONFIRMED') {
          const receipt = await waitForTxReceipt({ txHash });
          console.log(
            `Transaction submitted through the relay. View transaction on block explorer https://${getExplorerLink()}/tx/${txHash}`
          );
          console.log('Transaction mined in block', receipt.blockNumber);
          resolve(status);
        }
      }

      setTimeout(() => {
        getRelayerStatus(id, relayerURL);
      }, 3000)
    }

    getRelayerStatus();
  })
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function fromDecimals({ amount, decimals }) {
  amount = amount.toString();
  let ether = amount.toString();
  const base = new BN('10').pow(new BN(decimals));
  const baseLength = base.toString(10).length - 1 || 1;

  const negative = ether.substring(0, 1) === '-';
  if (negative) {
    ether = ether.substring(1);
  }

  if (ether === '.') {
    throw new Error('[ethjs-unit] while converting number ' + amount + ' to wei, invalid value');
  }

  // Split it into a whole and fractional part
  const comps = ether.split('.');
  if (comps.length > 2) {
    throw new Error('[ethjs-unit] while converting number ' + amount + ' to wei,  too many decimal points');
  }

  let whole = comps[0];
  let fraction = comps[1];

  if (!whole) {
    whole = '0';
  }
  if (!fraction) {
    fraction = '0';
  }
  if (fraction.length > baseLength) {
    throw new Error('[ethjs-unit] while converting number ' + amount + ' to wei, too many decimal places');
  }

  while (fraction.length < baseLength) {
    fraction += '0';
  }

  whole = new BN(whole);
  fraction = new BN(fraction);
  let wei = whole.mul(base).add(fraction);

  if (negative) {
    wei = wei.mul(negative);
  }

  return new BN(wei.toString(10), 10);
}

function toDecimals(value, decimals, fixed) {
  const zero = new BN(0);
  const negative1 = new BN(-1);
  decimals = decimals || 18;
  fixed = fixed || 7;

  value = new BN(value);
  const negative = value.lt(zero);
  const base = new BN('10').pow(new BN(decimals));
  const baseLength = base.toString(10).length - 1 || 1;

  if (negative) {
    value = value.mul(negative1);
  }

  let fraction = value.mod(base).toString(10);
  while (fraction.length < baseLength) {
    fraction = `0${fraction}`;
  }
  fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];

  const whole = value.div(base).toString(10);
  value = `${whole}${fraction === '0' ? '' : `.${fraction}`}`;

  if (negative) {
    value = `-${value}`;
  }

  if (fixed) {
    value = value.slice(0, fixed);
  }

  return value;
}

// List fetched from https://github.com/ethereum-lists/chains/blob/master/_data/chains
function getExplorerLink() {
  switch (netId) {
    case 56:
      return 'bscscan.com';
    case 100:
      return 'blockscout.com/poa/xdai';
    case 137:
      return 'polygonscan.com';
    case 42161:
      return 'arbiscan.io';
    case 43114:
      return 'snowtrace.io';
    case 5:
      return 'goerli.etherscan.io';
    case 42:
      return 'kovan.etherscan.io';
    case 10:
      return 'optimistic.etherscan.io';
    default:
      return 'etherscan.io';
  }
}

// List fetched from https://github.com/trustwallet/assets/tree/master/blockchains
function getCurrentNetworkName() {
  switch (netId) {
    case 1:
      return 'Ethereum';
    case 56:
      return 'BinanceSmartChain';
    case 100:
      return 'GnosisChain';
    case 137:
      return 'Polygon';
    case 42161:
      return 'Arbitrum';
    case 43114:
      return 'Avalanche';
    case 5:
      return 'Goerli';
    case 42:
      return 'Kovan';
    case 10:
      return 'Optimism';
    default:
      return 'testRPC';
  }
}

function getCurrentNetworkSymbol() {
  switch (netId) {
    case 56:
      return 'BNB';
    case 100:
      return 'xDAI';
    case 137:
      return 'MATIC';
    case 43114:
      return 'AVAX';
    default:
      return 'ETH';
  }
}

function gasPricesETH(value = 80) {
  const tenPercent = (Number(value) * 5) / 100;
  const max = Math.max(tenPercent, 3);
  const bumped = Math.floor(Number(value) + max);
  return toHex(toWei(bumped.toString(), 'gwei'));
}

function gasPrices(value = 5) {
  return toHex(toWei(value.toString(), 'gwei'));
}

async function fetchGasPrice() {
  try {
    const options = {
      chainId: netId
    }
    // Bump fees for Ethereum network
    if (netId == 1) {
      const oracle = new GasPriceOracle(options);
      const gas = await oracle.gasPrices();
      return gasPricesETH(gas.instant);
    } else if (netId == 5 || isTestRPC) {
      const web3GasPrice = await web3.eth.getGasPrice();
      return web3GasPrice;
    } else {
      const oracle = new GasPriceOracle(options);
      const gas = await oracle.gasPrices();
      return gasPrices(gas.instant);
    }
  } catch (err) {
    throw new Error(`Method fetchGasPrice has error ${err.message}`);
  }
}

function calculateFee({ currency, gasPrice, amount, refund, ethPrices, relayerServiceFee, decimals }) {
  const decimalsPoint =
    Math.floor(relayerServiceFee) === Number(relayerServiceFee) ? 0 : relayerServiceFee.toString().split('.')[1].length;
  const roundDecimal = 10 ** decimalsPoint;
  const total = toBN(fromDecimals({ amount, decimals }));
  const feePercent = total.mul(toBN(relayerServiceFee * roundDecimal)).div(toBN(roundDecimal * 100));
  const expense = toBN(gasPrice).mul(toBN(5e5));
  let desiredFee;
  switch (currency) {
    case netSymbol.toLowerCase(): {
      desiredFee = expense.add(feePercent);
      break;
    }
    default: {
      desiredFee = expense
        .add(toBN(refund))
        .mul(toBN(10 ** decimals))
        .div(toBN(ethPrices[currency]));
      desiredFee = desiredFee.add(feePercent);
      break;
    }
  }
  return desiredFee;
}

/**
 * Waits for transaction to be mined
 * @param txHash Hash of transaction
 * @param attempts
 * @param delay
 */
function waitForTxReceipt({ txHash, attempts = 60, delay = 1000 }) {
  return new Promise((resolve, reject) => {
    const checkForTx = async (txHash, retryAttempt = 0) => {
      const result = await web3.eth.getTransactionReceipt(txHash);
      if (!result || !result.blockNumber) {
        if (retryAttempt <= attempts) {
          setTimeout(() => checkForTx(txHash, retryAttempt + 1), delay);
        } else {
          reject(new Error('tx was not mined'));
        }
      } else {
        resolve(result);
      }
    }
    checkForTx(txHash);
  })
}

function initJson(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (error, data) => {
      if (error) {
        resolve([]);
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        resolve([]);
      }
    });
  });
};

function loadCachedEvents({ type, currency, amount }) {
  try {
    const module = require(`./cache/${netName.toLowerCase()}/${type}s_${currency}_${amount}.json`);

    if (module) {
      const events = module;

      return {
        events,
        lastBlock: events[events.length - 1].blockNumber
      }
    }
  } catch (err) {
    console.log("Error fetching cached files, syncing from block", deployedBlockNumber);
    return {
      events: [],
      lastBlock: deployedBlockNumber,
    }
  }
}

async function fetchEvents({ type, currency, amount }) {
  if (type === "withdraw") {
    type = "withdrawal";
  }

  const cachedEvents = loadCachedEvents({ type, currency, amount });
  const startBlock = cachedEvents.lastBlock + 1;

  console.log("Loaded cached",amount,currency.toUpperCase(),type,"events for",startBlock,"block");
  console.log("Fetching",amount,currency.toUpperCase(),type,"events for",netName,"network");

  async function syncEvents() {
    try {
      let targetBlock = await web3.eth.getBlockNumber();
      let chunks = 1000;
      console.log("Querying latest events from RPC");

      for (let i = startBlock; i < targetBlock; i += chunks) {
        let fetchedEvents = [];

        function mapDepositEvents() {
          fetchedEvents = fetchedEvents.map(({ blockNumber, transactionHash, returnValues }) => {
            const { commitment, leafIndex, timestamp } = returnValues;
            return {
              blockNumber,
              transactionHash,
              commitment,
              leafIndex: Number(leafIndex),
              timestamp
            }
          });
        }

        function mapWithdrawEvents() {
          fetchedEvents = fetchedEvents.map(({ blockNumber, transactionHash, returnValues }) => {
            const { nullifierHash, to, fee } = returnValues;
            return {
              blockNumber,
              transactionHash,
              nullifierHash,
              to,
              fee
            }
          });
        }

        function mapLatestEvents() {
          if (type === "deposit"){
            mapDepositEvents();
          } else {
            mapWithdrawEvents();
          }
        }

        async function fetchWeb3Events(i) {
          let j;
          if (i + chunks - 1 > targetBlock) {
            j = targetBlock;
          } else {
            j = i + chunks - 1;
          }
          await tornadoContract.getPastEvents(capitalizeFirstLetter(type), {
            fromBlock: i,
            toBlock: j,
          }).then(r => { fetchedEvents = fetchedEvents.concat(r); console.log("Fetched", amount, currency.toUpperCase(), type, "events to block:", j) }, err => { console.error(i + " failed fetching", type, "events from node", err); process.exit(1); }).catch(console.log);

          if (type === "deposit"){
            mapDepositEvents();
          } else {
            mapWithdrawEvents();
          }
        }

        async function updateCache() {
          try {
            const fileName = `./cache/${netName.toLowerCase()}/${type}s_${currency}_${amount}.json`;
            const localEvents = await initJson(fileName);
            const events = localEvents.concat(fetchedEvents);
            await fs.writeFileSync(fileName, JSON.stringify(events, null, 2), 'utf8');
          } catch (error) {
            throw new Error('Writing cache file failed:',error);
          }
        }
        await fetchWeb3Events(i);
        await updateCache();
      }
    } catch (error) {
      throw new Error("Error while updating cache");
      process.exit(1);
    }
  }

  async function syncGraphEvents() {
    let options = {};
    if (torPort) {
      options = { httpsAgent: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' } };
    }

    async function queryLatestTimestamp() {
      try {
        const variables = {
          currency: currency.toString(),
          amount: amount.toString()
        }
        if (type === "deposit") {
          const query = {
            query: `
            query($currency: String, $amount: String){
              deposits(first: 1, orderBy: timestamp, orderDirection: desc, where: {currency: $currency, amount: $amount}) {
                timestamp
              }
            }
            `,
            variables
          }
          const querySubgraph = await axios.post(subgraph, query, options);
          const queryResult = querySubgraph.data.data.deposits;
          const result = queryResult[0].timestamp;
          return Number(result);
        } else {
          const query = {
            query: `
            query($currency: String, $amount: String){
              withdrawals(first: 1, orderBy: timestamp, orderDirection: desc, where: {currency: $currency, amount: $amount}) {
                timestamp
              }
            }
            `,
            variables
          }
          const querySubgraph = await axios.post(subgraph, query, options);
          const queryResult = querySubgraph.data.data.withdrawals;
          const result = queryResult[0].timestamp;
          return Number(result);
        }
      } catch (error) {
        console.error("Failed to fetch latest event from thegraph");
      }
    }

    async function queryFromGraph(timestamp) {
      try {
        const variables = {
          currency: currency.toString(),
          amount: amount.toString(),
          timestamp: timestamp
        }
        if (type === "deposit") {
          const query = {
            query: `
            query($currency: String, $amount: String, $timestamp: Int){
              deposits(orderBy: timestamp, first: 1000, where: {currency: $currency, amount: $amount, timestamp_gt: $timestamp}) {
                blockNumber
                transactionHash
                commitment
                index
                timestamp
              }
            }
            `,
            variables
          }
          const querySubgraph = await axios.post(subgraph, query, options);
          const queryResult = querySubgraph.data.data.deposits;
          const mapResult = queryResult.map(({ blockNumber, transactionHash, commitment, index, timestamp }) => {
            return {
              blockNumber: Number(blockNumber),
              transactionHash,
              commitment,
              leafIndex: Number(index),
              timestamp
            }
          });
          return mapResult;
        } else {
          const query = {
            query: `
            query($currency: String, $amount: String, $timestamp: Int){
              withdrawals(orderBy: timestamp, first: 1000, where: {currency: $currency, amount: $amount, timestamp_gt: $timestamp}) {
                blockNumber
                transactionHash
                nullifier
                to
                fee
              }
            }
            `,
            variables
          }
          const querySubgraph = await axios.post(subgraph, query, options);
          const queryResult = querySubgraph.data.data.withdrawals;
          const mapResult = queryResult.map(({ blockNumber, transactionHash, nullifier, to, fee }) => {
            return {
              blockNumber: Number(blockNumber),
              transactionHash,
              nullifierHash: nullifier,
              to,
              fee
            }
          });
          return mapResult;
        }
      } catch (error) {
        console.error(error);
      }
    }

    async function updateCache(fetchedEvents) {
      try {
        const fileName = `./cache/${netName.toLowerCase()}/${type}s_${currency}_${amount}.json`;
        const localEvents = await initJson(fileName);
        const events = localEvents.concat(fetchedEvents);
        await fs.writeFileSync(fileName, JSON.stringify(events, null, 2), 'utf8');
      } catch (error) {
        throw new Error('Writing cache file failed:',error);
      }
    }

    async function fetchGraphEvents() {
      console.log("Querying latest events from TheGraph");
      const latestTimestamp = await queryLatestTimestamp();
      if (latestTimestamp) {
        const getCachedBlock = await web3.eth.getBlock(startBlock);
        const cachedTimestamp = getCachedBlock.timestamp;
        for (let i = cachedTimestamp; i < latestTimestamp;) {
          const result = await queryFromGraph(i);
          if (Object.keys(result).length === 0) {
            i = latestTimestamp;
          } else {
            if (type === "deposit") {
              const resultBlock = result[result.length - 1].blockNumber;
              const resultTimestamp = result[result.length - 1].timestamp;
              await updateCache(result);
              i = resultTimestamp;
              console.log("Fetched", amount, currency.toUpperCase(), type, "events to block:", Number(resultBlock));
            } else {
              const resultBlock = result[result.length - 1].blockNumber;
              const getResultBlock = await web3.eth.getBlock(resultBlock);
              const resultTimestamp = getResultBlock.timestamp;
              await updateCache(result);
              i = resultTimestamp;
              console.log("Fetched", amount, currency.toUpperCase(), type, "events to block:", Number(resultBlock));
            }
          }
        }
      } else {
        console.log("Fallback to web3 events");
        await syncEvents();
      }
    }
    await fetchGraphEvents();
  }
  if (!privateRpc && !subgraph && !isTestRPC) {
    await syncGraphEvents();
  } else {
    await syncEvents();
  }

  async function loadUpdatedEvents() {
    const fileName = `./cache/${netName.toLowerCase()}/${type}s_${currency}_${amount}.json`;
    const updatedEvents = await initJson(fileName);
    const updatedBlock = updatedEvents[updatedEvents.length - 1].blockNumber;
    console.log("Cache updated for Tornado",type,amount,currency,"instance to block",updatedBlock,"successfully");
    console.log(`Total ${type}s:`, updatedEvents.length);
    return updatedEvents;
  }
  const events = await loadUpdatedEvents();
  return events;
}

/**
 * Parses Tornado.cash note
 * @param noteString the note
 */
function parseNote(noteString) {
  const noteRegex = /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g
  const match = noteRegex.exec(noteString);
  if (!match) {
    throw new Error('The note has invalid format');
  }

  const buf = Buffer.from(match.groups.note, 'hex');
  const nullifier = bigInt.leBuff2int(buf.slice(0, 31));
  const secret = bigInt.leBuff2int(buf.slice(31, 62));
  const deposit = createDeposit({ nullifier, secret });
  const netId = Number(match.groups.netId);

  return {
    currency: match.groups.currency,
    amount: match.groups.amount,
    netId,
    deposit
  }
}

/**
 * Parses Tornado.cash deposit invoice
 * @param invoiceString the note
 */
function parseInvoice(invoiceString) {
  const noteRegex = /tornadoInvoice-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<commitmentNote>[0-9a-fA-F]{64})/g
  const match = noteRegex.exec(invoiceString)
  if (!match) {
    throw new Error('The note has invalid format')
  }

  const netId = Number(match.groups.netId)
  const buf = Buffer.from(match.groups.commitmentNote, 'hex')
  const commitmentNote = toHex(buf.slice(0, 32))

  return {
    currency: match.groups.currency,
    amount: match.groups.amount,
    netId,
    commitmentNote
  }
}

async function loadDepositData({ amount, currency, deposit }) {
  try {
    const cachedEvents = await fetchEvents({ type: 'deposit', currency, amount });
    const eventWhenHappened = await cachedEvents.filter(function (event) {
      return event.commitment === deposit.commitmentHex;
    })[0];

    if (eventWhenHappened.length === 0) {
      throw new Error('There is no related deposit, the note is invalid');
    }

    const timestamp = eventWhenHappened.timestamp;
    const txHash = eventWhenHappened.transactionHash;
    const isSpent = await tornadoContract.methods.isSpent(deposit.nullifierHex).call();
    const receipt = await web3.eth.getTransactionReceipt(txHash);

    return {
      timestamp,
      txHash,
      isSpent,
      from: receipt.from,
      commitment: deposit.commitmentHex
    }
  } catch (e) {
    console.error('loadDepositData', e);
  }
  return {}
}
async function loadWithdrawalData({ amount, currency, deposit }) {
  try {
    const cachedEvents = await fetchEvents({ type: 'withdrawal', currency, amount });

    const withdrawEvent = cachedEvents.filter((event) => {
      return event.nullifierHash === deposit.nullifierHex
    })[0];

    const fee = withdrawEvent.fee;
    const decimals = config.deployments[`netId${netId}`][currency].decimals;
    const withdrawalAmount = toBN(fromDecimals({ amount, decimals })).sub(toBN(fee));
    const { timestamp } = await web3.eth.getBlock(withdrawEvent.blockNumber);
    return {
      amount: toDecimals(withdrawalAmount, decimals, 9),
      txHash: withdrawEvent.transactionHash,
      to: withdrawEvent.to,
      timestamp,
      nullifier: deposit.nullifierHex,
      fee: toDecimals(fee, decimals, 9)
    }
  } catch (e) {
    console.error('loadWithdrawalData', e);
  }
}

/**
 * Init web3, contracts, and snark
 */
async function init({ rpc, noteNetId, currency = 'dai', amount = '100', balanceCheck, localMode }) {
  let contractJson, instanceJson, erc20ContractJson, erc20tornadoJson, tornadoAddress, tokenAddress;
  // TODO do we need this? should it work in browser really?
  if (inBrowser) {
    // Initialize using injected web3 (Metamask)
    // To assemble web version run `npm run browserify`
    web3 = new Web3(window.web3.currentProvider, null, {
      transactionConfirmationBlocks: 1
    });
    contractJson = await (await fetch('build/contracts/TornadoProxy.abi.json')).json();
    instanceJson = await (await fetch('build/contracts/Instance.abi.json')).json();
    circuit = await (await fetch('build/circuits/tornado.json')).json();
    proving_key = await (await fetch('build/circuits/tornadoProvingKey.bin')).arrayBuffer();
    MERKLE_TREE_HEIGHT = 20;
    ETH_AMOUNT = 1e18;
    TOKEN_AMOUNT = 1e19;
    senderAccount = (await web3.eth.getAccounts())[0];
  } else {
    let ipOptions = {};
    if (torPort && rpc.includes("https")) {
      console.log("Using tor network");
      web3Options = { agent: { https: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort) }, timeout: 60000 };
      // Use forked web3-providers-http from local file to modify user-agent header value which improves privacy.
      web3 = new Web3(new Web3HttpProvider(rpc, web3Options), null, { transactionConfirmationBlocks: 1 });
      ipOptions = { httpsAgent: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' } };
    } else if (torPort && rpc.includes("http")) {
      console.log("Using tor network");
      web3Options = { agent: { http: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort) }, timeout: 60000 };
      // Use forked web3-providers-http from local file to modify user-agent header value which improves privacy.
      web3 = new Web3(new Web3HttpProvider(rpc, web3Options), null, { transactionConfirmationBlocks: 1 });
      ipOptions = { httpsAgent: new SocksProxyAgent('socks5h://127.0.0.1:' + torPort), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' } };
    } else if (rpc.includes("ipc")) {
      console.log("Using ipc connection");
      web3 = new Web3(new Web3.providers.IpcProvider(rpc, net), null, { transactionConfirmationBlocks: 1 });
    } else if (rpc.includes("ws") || rpc.includes("wss")) {
      console.log("Using websocket connection (Note: Tor is not supported for Websocket providers)");
      web3Options = { clientConfig: { keepalive: true, keepaliveInterval: -1 }, reconnect: { auto: true, delay: 1000, maxAttempts: 10, onTimeout: false } };
      web3 = new Web3(new Web3.providers.WebsocketProvider(rpc, web3Options), net, { transactionConfirmationBlocks: 1 });
    } else {
      console.log("Connecting to remote node");
      web3 = new Web3(rpc, null, { transactionConfirmationBlocks: 1 });
    }
    const rpcHost = new URL(rpc).hostname;
    const isIpPrivate = is_ip_private(rpcHost);
    if (!isIpPrivate && !rpc.includes("localhost") && !privateRpc) {
      try {
        const fetchRemoteIP = await axios.get('https://ip.tornado.cash', ipOptions);
        const { country, ip } = fetchRemoteIP.data;
        console.log('Your remote IP address is', ip, 'from', country + '.');
      } catch (error) {
        console.error('Could not fetch remote IP from ip.tornado.cash, use VPN if the problem repeats.');
      }
    } else if (isIpPrivate || rpc.includes("localhost")) {
      console.log('Local RPC detected');
      privateRpc = true;
    }
    contractJson = require('./build/contracts/TornadoProxy.abi.json');
    instanceJson = require('./build/contracts/Instance.abi.json');
    circuit = require('./build/circuits/tornado.json');
    proving_key = fs.readFileSync('build/circuits/tornadoProvingKey.bin').buffer;
    MERKLE_TREE_HEIGHT = process.env.MERKLE_TREE_HEIGHT || 20;
    ETH_AMOUNT = process.env.ETH_AMOUNT;
    TOKEN_AMOUNT = process.env.TOKEN_AMOUNT;
    const privKey = process.env.PRIVATE_KEY;
    if (privKey) {
      if (privKey.includes("0x")) {
        PRIVATE_KEY = process.env.PRIVATE_KEY.substring(2);
      } else {
        PRIVATE_KEY = process.env.PRIVATE_KEY;
      }
    }
    if (PRIVATE_KEY) {
      const account = web3.eth.accounts.privateKeyToAccount('0x' + PRIVATE_KEY);
      web3.eth.accounts.wallet.add('0x' + PRIVATE_KEY);
      web3.eth.defaultAccount = account.address;
      senderAccount = account.address;
    }
    erc20ContractJson = require('./build/contracts/ERC20Mock.json');
    erc20tornadoJson = require('./build/contracts/ERC20Tornado.json');
  }
  // groth16 initialises a lot of Promises that will never be resolved, that's why we need to use process.exit to terminate the CLI
  groth16 = await buildGroth16();
  netId = await web3.eth.net.getId();
  netName = getCurrentNetworkName();
  netSymbol = getCurrentNetworkSymbol();
  if (noteNetId && Number(noteNetId) !== netId) {
    throw new Error('This note is for a different network. Specify the --rpc option explicitly');
  }
  if (netName === "testRPC") {
    isTestRPC = true;
  }
  if (localMode) {
    console.log("Local mode detected: will not submit signed TX to remote node");
    doNotSubmitTx = true;
  }

  if (isTestRPC) {
    tornadoAddress = currency === netSymbol.toLowerCase() ? contractJson.networks[netId].address : erc20tornadoJson.networks[netId].address;
    tokenAddress = currency !== netSymbol.toLowerCase() ? erc20ContractJson.networks[netId].address : null;
    deployedBlockNumber = 0;
    senderAccount = (await web3.eth.getAccounts())[0];
  } else {
    try {
      if (balanceCheck) {
        currency = netSymbol.toLowerCase();
        amount = Object.keys(config.deployments[`netId${netId}`][currency].instanceAddress)[0];
      }
      tornadoAddress = config.deployments[`netId${netId}`].proxy;
      multiCall = config.deployments[`netId${netId}`].multicall;
      subgraph = config.deployments[`netId${netId}`].subgraph;
      tornadoInstance = config.deployments[`netId${netId}`][currency].instanceAddress[amount];
      deployedBlockNumber = config.deployments[`netId${netId}`][currency].deployedBlockNumber[amount];

      if (!tornadoAddress) {
        throw new Error();
      }
      tokenAddress = currency !== netSymbol.toLowerCase() ? config.deployments[`netId${netId}`][currency].tokenAddress : null;
    } catch (e) {
      console.error('There is no such tornado instance, check the currency and amount you provide', e);
      process.exit(1);
    }
  }
  tornado = new web3.eth.Contract(contractJson, tornadoAddress);
  tornadoContract = new web3.eth.Contract(instanceJson, tornadoInstance);
  contractAddress = tornadoAddress;
  erc20 = currency !== netSymbol.toLowerCase() ? new web3.eth.Contract(erc20ContractJson.abi, tokenAddress) : {};
  erc20Address = tokenAddress;
}

async function main() {
  if (inBrowser) {
    const instance = { currency: 'eth', amount: '0.1' };
    await init(instance);
    window.deposit = async () => {
      await deposit(instance);
    }
    window.withdraw = async () => {
      const noteString = prompt('Enter the note to withdraw');
      const recipient = (await web3.eth.getAccounts())[0];

      const { currency, amount, netId, deposit } = parseNote(noteString);
      await init({ noteNetId: netId, currency, amount });
      await withdraw({ deposit, currency, amount, recipient });
    }
  } else {
    program
      .option('-r, --rpc <URL>', 'The RPC that CLI should interact with', 'http://localhost:8545')
      .option('-R, --relayer <URL>', 'Withdraw via relayer')
      .option('-T, --tor <PORT>', 'Optional tor port')
      .option('-L, --local', 'Local Node - Does not submit signed transaction to the node')
      .option('-o, --onlyrpc', 'Only rpc mode - Does not enable thegraph api nor remote ip detection');
    program
      .command('createNote <currency> <amount> <chainId>')
      .description(
        'Create deposit note and invoice, allows generating private key like deposit notes from secure, offline environment. The currency is one of (ETH|DAI|cDAI|USDC|cUSDC|USDT). The amount depends on currency, see config.js file or visit https://tornado.cash.'
      )
      .action(async (currency, amount, chainId) => {
        currency = currency.toLowerCase();
        await createInvoice({ currency, amount, chainId });
      });
    program
      .command('depositInvoice <invoice>')
      .description(
        'Submit a deposit of invoice from default eth account and return the resulting note.'
      )
      .action(async (invoice) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        torPort = program.tor;
        const { currency, amount, netId, commitmentNote } = parseInvoice(invoice);
        await init({ rpc: program.rpc, currency, amount, localMode: program.local });
        console.log("Creating", currency.toUpperCase(), amount, "deposit for", netName, "Tornado Cash Instance");
        await deposit({ currency, amount, commitmentNote });
      });
    program
      .command('deposit <currency> <amount>')
      .description(
        'Submit a deposit of specified currency and amount from default eth account and return the resulting note. The currency is one of (ETH|DAI|cDAI|USDC|cUSDC|USDT). The amount depends on currency, see config.js file or visit https://tornado.cash.'
      )
      .action(async (currency, amount) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        currency = currency.toLowerCase();
        torPort = program.tor;
        await init({ rpc: program.rpc, currency, amount, localMode: program.local });
        await deposit({ currency, amount });
      });
    program
      .command('withdraw <note> <recipient> [ETH_purchase]')
      .description(
        'Withdraw a note to a recipient account using relayer or specified private key. You can exchange some of your deposit`s tokens to ETH during the withdrawal by specifing ETH_purchase (e.g. 0.01) to pay for gas in future transactions. Also see the --relayer option.'
      )
      .action(async (noteString, recipient, refund) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        const { currency, amount, netId, deposit } = parseNote(noteString);
        torPort = program.tor;
        await init({ rpc: program.rpc, noteNetId: netId, currency, amount, localMode: program.local });
        await withdraw({
          deposit,
          currency,
          amount,
          recipient,
          refund,
          relayerURL: program.relayer
        });
      });
    program
      .command('balance [address] [token_address]')
      .description('Check ETH and ERC20 balance')
      .action(async (address, tokenAddress) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        torPort = program.tor;
        await init({ rpc: program.rpc, balanceCheck: true });
        if (!address && senderAccount) {
          console.log("Using address", senderAccount, "from private key");
          address = senderAccount;
        }
        await printETHBalance({ address, name: 'Account' });
        if (tokenAddress) {
          await printERC20Balance({ address, name: 'Account', tokenAddress });
        }
      });
    program
      .command('send <address> [amount] [token_address]')
      .description('Send ETH or ERC to address')
      .action(async (address, amount, tokenAddress) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        torPort = program.tor;
        await init({ rpc: program.rpc, balanceCheck: true, localMode: program.local });
        await send({ address, amount, tokenAddress });
      });
    program
      .command('broadcast <signedTX>')
      .description('Submit signed TX to the remote node')
      .action(async (signedTX) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        torPort = program.tor;
        await init({ rpc: program.rpc, balanceCheck: true });
        await submitTransaction(signedTX);
      });
    program
      .command('compliance <note>')
      .description(
        'Shows the deposit and withdrawal of the provided note. This might be necessary to show the origin of assets held in your withdrawal address.'
      )
      .action(async (noteString) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        const { currency, amount, netId, deposit } = parseNote(noteString);
        torPort = program.tor;
        await init({ rpc: program.rpc, noteNetId: netId, currency, amount });
        const depositInfo = await loadDepositData({ amount, currency, deposit });
        const depositDate = new Date(depositInfo.timestamp * 1000);
        console.log('\n=============Deposit=================');
        console.log('Deposit     :', amount, currency.toUpperCase());
        console.log('Date        :', depositDate.toLocaleDateString(), depositDate.toLocaleTimeString());
        console.log('From        :', `https://${getExplorerLink()}/address/${depositInfo.from}`);
        console.log('Transaction :', `https://${getExplorerLink()}/tx/${depositInfo.txHash}`);
        console.log('Commitment  :', depositInfo.commitment);
        console.log('Spent       :', depositInfo.isSpent);
        if (!depositInfo.isSpent) {
          console.log('The note was not spent');
          return;
        }
        console.log('=====================================', '\n');

        const withdrawInfo = await loadWithdrawalData({ amount, currency, deposit });
        const withdrawalDate = new Date(withdrawInfo.timestamp * 1000);
        console.log('\n=============Withdrawal==============');
        console.log('Withdrawal  :', withdrawInfo.amount, currency);
        console.log('Relayer Fee :', withdrawInfo.fee, currency);
        console.log('Date        :', withdrawalDate.toLocaleDateString(), withdrawalDate.toLocaleTimeString());
        console.log('To          :', `https://${getExplorerLink()}/address/${withdrawInfo.to}`);
        console.log('Transaction :', `https://${getExplorerLink()}/tx/${withdrawInfo.txHash}`);
        console.log('Nullifier   :', withdrawInfo.nullifier);
        console.log('=====================================', '\n');
      });
    program
      .command('syncEvents <type> <currency> <amount>')
      .description(
        'Sync the local cache file of deposit / withdrawal events for specific currency.'
      )
      .action(async (type, currency, amount) => {
        if (program.onlyrpc) {
          privateRpc = true;
        }
        console.log("Starting event sync command");
        currency = currency.toLowerCase();
        torPort = program.tor;
        await init({ rpc: program.rpc, type, currency, amount });
        const cachedEvents = await fetchEvents({ type, currency, amount });
        console.log("Synced event for", type, amount, currency.toUpperCase(), netName, "Tornado instance to block", cachedEvents[cachedEvents.length - 1].blockNumber);
      });
    program
      .command('test')
      .description('Perform an automated test. It deposits and withdraws one ETH and one ERC20 note. Uses ganache.')
      .action(async () => {
        privateRpc = true;
        console.log('Start performing ETH deposit-withdraw test');
        let currency = 'eth';
        let amount = '0.1';
        await init({ rpc: program.rpc, currency, amount });
        let noteString = await deposit({ currency, amount });
        let parsedNote = parseNote(noteString);
        await withdraw({
          deposit: parsedNote.deposit,
          currency,
          amount,
          recipient: senderAccount,
          relayerURL: program.relayer
        });

        console.log('\nStart performing DAI deposit-withdraw test');
        currency = 'dai';
        amount = '100';
        await init({ rpc: program.rpc, currency, amount });
        noteString = await deposit({ currency, amount });
        parsedNote = parseNote(noteString);
        await withdraw({
          deposit: parsedNote.deposit,
          currency,
          amount,
          recipient: senderAccount,
          refund: '0.02',
          relayerURL: program.relayer
        });
      });
    try {
      await program.parseAsync(process.argv);
      process.exit(0);
    } catch (e) {
      console.log('Error:', e);
      process.exit(1);
    }
  }
}

main();
