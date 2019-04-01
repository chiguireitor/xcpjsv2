const xcputil = require('../xcputil.js')
const ID = Buffer.from('0A', 'hex')

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
      xcputil.intToHalf(expiration),
      xcputil.bn64be(feeRequired)
    ])
  }
}
