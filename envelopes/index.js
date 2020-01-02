const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService, additionalOutputs,coinSelect,network) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService, additionalOutputs,coinSelect,network)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn'))
}
