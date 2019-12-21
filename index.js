(function()
{

  var exports = module.exports = {};

  const bitcoin = require('bitcoinjs-lib')
  const messages = require('./messages')
  const envelopes = require('./envelopes')
  const services = require('./services')

  let network = {
    messagePrefix: '\u0018Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 70617039,
      private: 70615956
    },
    pubKeyHash: 100,
    scriptHash: 40,
    wif: 239
  }

  let utxoService, broadcastService

  exports.sendraw = async function(source, destination, asset, quantity, memo, memoIsHex, coinSelect) {
    let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
    return _envelopeAndBuild_(source, msg, true, coinSelect)
  }

  exports.send = async function(source, destination, asset, quantity, memo, memoIsHex) {
    let msg = messages.send.compose(asset, destination, quantity, memo, memoIsHex)
    return _envelopeAndBuild_(source, msg, false)
  }

  exports.order = async function (source, giveAsset, giveQuantity, getAsset, getQuantity) {
    let msg = messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
    return _envelopeAndBuild_(source, msg, false)
  }

  exports.issuanceraw = async function (source, transferDestination, asset, quantity, divisible, description, coinSelect) {
    console.log("this is issuanceraw coinSelect", coinSelect)
    let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
    console.log("this is issuanceraw coinSelect", coinSelect)
    return _envelopeAndBuild_(source, msg, true, coinSelect)
  }

  exports.issuance = async function (source, transferDestination, asset, quantity, divisible, description) {
    let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
    return _envelopeAndBuild_(source, msg, false)
  }

  exports.broadcast = async function (source, timestamp, value, feeFraction, text) {
    let msg = messages.broadcast.compose(source, timestamp, value, feeFraction, text)
    return _envelopeAndBuild_(source, msg, false)
  }

  exports.broadcastRawTx = async function (tx) {
    let broadcastResult = await broadcastService.broadcast(tx)
    return broadcastResult
  }

  exports._envelopeAndBuild_ = async function (source, msg, getraw, cs) {
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

    if (getraw) {
      return [unsignedTxBuilder.buildIncomplete().toHex(), envelope.coinSelect]
    }

    let txHex = unsignedTxBuilder.build().toHex()
    let broadcastResult = await broadcastService.broadcast(txHex)
    return broadcastResult
  }

  exports.setNetwork = function (name) {
    network = bitcoin.networks[name]
  }

  exports.setUtxoService = function (srv) {
    utxoService = srv
  }

  exports.setBroadcastService = function (srv) {
    broadcastService = srv
  }

  // module.exports = {
  //   services,
  //   setNetwork,
  //   setUtxoService,
  //   setBroadcastService,
  //   send,
  //   order,
  //   issuance,
  //   broadcast,
  //   sendraw,
  //   issuanceraw,
  //   broadcastRawTx
  // }

  return exports;

})();
