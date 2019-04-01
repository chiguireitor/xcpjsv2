const xcputil = require('../xcputil.js')
const ID = Buffer.from('02', 'hex')

module.exports = {
  compose: (asset, dest, amount, memo, memoIsHex) => {
    let memoBuffer = memo?Buffer.from(memo, memoIsHex?'hex':'utf8'):Buffer.alloc(0)

    let assetBuff = xcputil.getAssetId(asset)
    let amountBuff = xcputil.bn64be(amount)
    let addressBuff = xcputil.addressShortDecode(dest)

    return Buffer.concat([
      ID,
      assetBuff,
      amountBuff,
      addressBuff,
      memoBuffer
    ])
  }
}
