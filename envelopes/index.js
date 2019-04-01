const PREFIX = Buffer.from('CNTRPRTY', 'utf8')

const addPrefix = (fn) => (data, utxoService) => {
  return fn(Buffer.concat([PREFIX, data]), utxoService)
}

module.exports = {
  opreturn: addPrefix(require('./opreturn'))
}
