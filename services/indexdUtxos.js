const axios = require('axios')

const BYTES_PER_USED_UTXO = 96

function pickUtxosOldestFirst(utxos, len, feePerByte, additionalNeededValue) {
  let feeSats = Math.round(len * feePerByte) + additionalNeededValue

  let ordered = utxos.sort((a, b) => b.height - a.height)
  let picked = []

  while (ordered.length > 0 && feeSats > 0) {
    let utxo = ordered.pop()

    //if (utxo.value > feePerByte * BYTES_PER_USED_UTXO) {
    if (utxo.value > feePerByte * BYTES_PER_USED_UTXO && utxo.value > 5430 && ((!utxo.coinbase) || (utxo.coinbase == 0) || (utxo.coinbase == 1 && utxo.confirmations > 100))) {
      picked.push(utxo)
      feeSats -= utxo.value
      feeSats += feePerByte * BYTES_PER_USED_UTXO
    }
  }

  if (feeSats <= 0) {
    return {
      remainingUtxos: ordered,
      picked, change: -feeSats
    }
  } else {
    throw new Error('Not enough balance, reduce fee')
  }
}

module.exports = baseURL => {
  const client = axios.create({ baseURL })

  return {
    forAddress: (addr, srcOps) => {
      let cachedUtxos = []

      return {
        getChangeAddress: async () => {
          return addr
        },
        findUtxos: async (ops) => {
          if (cachedUtxos.length === 0) {
            let utxos = await client.get('/a/' + addr + '/utxos')
            cachedUtxos = utxos.data
          }

          if ('forceUtxo' in ops) {
            let idx = cachedUtxos.indexOf(x => (x.txId === ops.txid) && (x.vout === ops.vout))

            if (idx >= 0) {
              let picked = [cachedUtxos[idx]]
              cachedUtxos.splice(idx, 1)

              return { utxos: picked, change: ops.forceUtxo.change}
            } else {
              throw new Error('UTXO not found')
            }
          } else if ('approximateByteLength' in ops && 'targetFeePerByte' in srcOps) {
            let {
              remainingUtxos,
              picked,
              change
            } = pickUtxosOldestFirst(cachedUtxos, ops.approximateByteLength, srcOps.targetFeePerByte, ops.additionalNeededValue)

            cachedUtxos = remainingUtxos
            return { utxos: picked, change }
          } else {
            return [cachedUtxos.shift()]
          }
        }
      }
    }
  }
}
