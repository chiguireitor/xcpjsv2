const xcputil = require('../xcputil.js')
const ID = Buffer.from('02', 'hex')

module.exports = {
  compose: (asset, dest, amount, memo, memoIsHex) => {
    let memoBuffer = memo?Buffer.from(memo, memoIsHex?'hex':'utf8'):Buffer.alloc(0)

    return Buffer.concat([
      ID,
      xcputil.getAssetId(asset),
      xcputil.bn64be(amount),
      xcputil.addressShortDecode(dest),
      memoBuffer
    ])
  }
}
