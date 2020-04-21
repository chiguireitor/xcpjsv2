class XCPJS {

  constructor() {

    this.bitcoin = require('bitcoinjs-lib')
    this.messages = require('./messages')
    this.envelopes = require('./envelopes')
    this.services = require('./services')
    this.network = {
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
    this.utxoService = null
    this.broadcastService = null

  }

  async sendraw(source, destination, asset, quantity, memo, memoIsHex, coinSelect) {
    let msg = this.messages.send.compose(asset, destination, quantity, memo, memoIsHex)
    return this._envelopeAndBuild_(source, msg, true, coinSelect)
  }

  async send(source, destination, asset, quantity, memo, memoIsHex) {
    let msg = this.messages.send.compose(asset, destination, quantity, memo, memoIsHex)
    return this._envelopeAndBuild_(source, msg, false)
  }

  async order(source, giveAsset, giveQuantity, getAsset, getQuantity) {
    let msg = this.messages.order.compose(source, giveAsset, giveQuantity, getAsset, getQuantity)
    return this._envelopeAndBuild_(source, msg, false)
  }

  async issuanceraw(source, transferDestination, asset, quantity, divisible, description, coinSelect) {
    console.log("this is issuanceraw coinSelect", coinSelect)
    let msg = this.messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
    console.log("this is issuanceraw coinSelect", coinSelect)
    return this._envelopeAndBuild_(source, msg, true, coinSelect)
  }

  async issuance(source, transferDestination, asset, quantity, divisible, description) {
    let msg = messages.issuance.compose(source, transferDestination, asset, quantity, divisible, description)
    return _envelopeAndBuild_(source, msg, false)
  }

  async broadcast(source, timestamp, value, feeFraction, text) {
    let msg = this.messages.broadcast.compose(source, timestamp, value, feeFraction, text)
    return this._envelopeAndBuild_(source, msg, false)
  }

  async broadcastraw(source, timestamp, value, feeFraction, text, coinSelect) {
    let msg = this.messages.broadcast.compose(source, timestamp, value, feeFraction, text)
    return this._envelopeAndBuild_(source, msg, true, coinSelect)
  }

  async broadcastRawTx(tx) {
    let broadcastResult = await broadcastService.broadcast(tx)
    return broadcastResult
  }

  async _envelopeAndBuild_(source, msg, getraw, cs) {
    let additionalOutputs = null
    if (typeof(msg) === 'object' && !Buffer.isBuffer(msg)) {
      additionalOutputs = msg.outputs
      msg = msg.msgData
    }

    let addrUtxoService = this.utxoService.forAddress(source, {
      targetFeePerByte: 10
    })

    let coinSelect = cs

    console.log("this is _envelopeAndBuild_ cs", coinSelect)
    console.log("pre opreturn params", msg, addrUtxoService, additionalOutputs, coinSelect)
    console.log('this.network',this.network)
    let envelope = await this.envelopes.opreturn(msg, addrUtxoService, additionalOutputs, coinSelect, this.network)
    console.log('envelope',envelope)
    envelope.inputs = envelope.coinSelect.utxos
    console.log('envelope.inputs',envelope.inputs)

    let unsignedTxBuilder = await this.services.transactionBuilder(this.network, envelope, additionalOutputs)
    await this.services.transactionSigner.sign(source, unsignedTxBuilder)

    if (getraw) {
      return [unsignedTxBuilder.buildIncomplete().toHex(), envelope.coinSelect]
    }

    let txHex = unsignedTxBuilder.build().toHex()
    let broadcastResult = await this.broadcastService.broadcast(txHex)
    return broadcastResult
  }

   setNetwork(network) {
    this.network = network
  }

   setUtxoService(srv) {
    this.utxoService = srv
  }

   setBroadcastService(srv) {
    this.broadcastService = srv
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

}

module.exports = XCPJS
