const bitcoin = require('bitcoinjs-lib')

const messages = require('./messages')
const envelopes = require('./envelopes')
const services = require('./services')

let network = { messagePrefix: '\u0018Bitcoin Signed Message:\n',
  bech32: 'tb',
  bip32: { public: 70617039, private: 70615956 },
  pubKeyHash: 100,
  scriptHash: 40,
  wif: 239 }

let utxoService, broadcastService


async function sendraw(source, destination, asset, quantity, memo, memoIsHex, coinSelect) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg, true, coinSelect)
}

async function send(source, destination, asset, quantity, memo, memoIsHex) {
  let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
  return _envelopeAndBuild_(source, msg, false)
}

async function order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
  let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
  return _envelopeAndBuild_(source, msg, false)
}

async function issuanceraw(source, transferDestination, asset, quantity, divisible, description, coinSelect) {
  console.log("this is issuanceraw coinSelect", coinSelect)
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
  console.log("this is issuanceraw coinSelect", coinSelect)
  return _envelopeAndBuild_(source, msg, true, coinSelect)
}

async function issuance(source, transferDestination, asset, quantity, divisible, description) {
  let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
  return _envelopeAndBuild_(source, msg, false)
}

async function broadcast(source, timestamp, value, feeFraction, text) {
  let msg = messages.broadcast.compose(source, timestamp, value, feeFraction, text)
  return _envelopeAndBuild_(source, msg, false)
}

async function broadcastRawTx(tx){
  let broadcastResult = await broadcastService.broadcast(tx)
  return broadcastResult
}

async function _envelopeAndBuild_(source, msg, getraw, cs) {
  let additionalOutputs = null
  if (typeof(msg) === 'object' && !Buffer.isBuffer(msg)) {
    additionalOutputs = msg.outputs
    msg = msg.msgData
  }

  let addrUtxoService = utxoService.forAddress(source, {
    targetFeePerByte: 10
  })

  let coinSelect = cs

  console.log("this is _envelopeAndBuild_ cs", coinSelect)
  console.log("pre opreturn params", msg, addrUtxoService, additionalOutputs, coinSelect)
  let envelope = await envelopes.opreturn(msg, addrUtxoService, additionalOutputs, coinSelect)
  envelope.inputs = envelope.coinSelect.utxos
  let unsignedTxBuilder = await services.transactionBuilder(network, envelope, additionalOutputs)
  await services.transactionSigner.sign(source, unsignedTxBuilder)

  if(getraw){
    return [unsignedTxBuilder.buildIncomplete().toHex(),envelope.coinSelect]
  }

  let txHex = unsignedTxBuilder.build().toHex()
  let broadcastResult = await broadcastService.broadcast(txHex)
  return broadcastResult
}

function setNetwork(name) {
  network = bitcoin.networks[name]
}

function setUtxoService(srv) {
  utxoService = srv
}

function setBroadcastService(srv) {
  broadcastService = srv
}

module.exports = {
  services,
  setNetwork,
  setUtxoService,
  setBroadcastService,
  send,
  order,
  issuance,
  broadcast,
  sendraw,
  issuanceraw,
  broadcastRawTx
}
