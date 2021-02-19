const xcputil = require('../xcputil.js')
const ID = Buffer.from('02', 'hex')

module.exports = {
  ID,
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
  },
  unpack: (buf) => {
    let asset = xcputil.idToAsset(buf.readBigUInt64BE(0))
    let quantity = buf.readBigUInt64BE(8)
    let address = xcputil.makeAddress(buf.slice(16, 37))
    let memo = buf.slice(37).toString('utf8')

    return {
      type: 'enhancedSend',
      asset, quantity,
      address, memo
    }
  }
}
