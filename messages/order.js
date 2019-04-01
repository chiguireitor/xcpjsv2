const xcputil = require('../xcputil.js')
const ID = Buffer.from('0A', 'hex')

function intToHalf(i) {
  let buff = Buffer.alloc(2)
  buff.writeUInt16BE(i)
  return buff
}

module.exports = {
  compose: (source, giveAsset, giveQuantity, getAsset, getQuantity, expiration, feeRequired) => {
    if (typeof(feeRequired) === 'undefined') {
      feeRequired = 0
    }

    if (typeof(expiration) === 'undefined') {
      expiration = 1000
    }

    return Buffer.concat([
      ID,
      xcputil.getAssetId(giveAsset),
      xcputil.bn64be(giveQuantity),
      xcputil.getAssetId(getAsset),
      xcputil.bn64be(getQuantity),
      intToHalf(expiration),
      xcputil.bn64be(feeRequired)
    ])
  }
}
