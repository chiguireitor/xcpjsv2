const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService, additionalOutputs, network) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService, additionalOutputs, network)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn'))
}
