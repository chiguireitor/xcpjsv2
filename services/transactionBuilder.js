const bitcoin = require('bitcoinjs-lib')

module.exports = async (network, { inputs, outputs }) => {
  let tb = new bitcoin.TransactionBuilder(network)

  inputs.forEach(txin => {
    tb.addInput(txin.txId, txin.vout)
  })

  outputs.forEach(txout => {
    tb.addOutput(txout.script, txout.value)
  })

  return tb
}
