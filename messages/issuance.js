const xcputil = require('../xcputil.js')
const ID = Buffer.from('14', 'hex')

module.exports = {
  compose: (source, transferDestination, asset, quantity, divisible, description) => {
    let assetId = xcputil.getAssetId(asset)
    let quantityBuff = xcputil.bn64be(quantity)

    let descriptionBuff
    if (description.length <= 42) {
      descriptionBuff = Buffer.alloc(description.length + 1)
      descriptionBuff.writeUInt8(description.length)
      Buffer.from(description, 'utf8').copy(descriptionBuff, 1)
    } else {
      descriptionBuff = Buffer.from(description, 'utf8')
    }

    let result = {
      msgData: Buffer.concat([
        ID,
        assetId, // Q
        quantityBuff, // Q
        xcputil.doByteBuffer(divisible?1:0), // ?
        xcputil.doByteBuffer(0), // ?
        xcputil.doIntBuffer(0), // I
        xcputil.doFloatBuffer(0.0), // f
        descriptionBuff // {}p o {}s
      ])
    }

    if (transferDestination) {
      result.outputs = [
        xcputil.createValueOutput(transferDestination, 5430)
      ]
    }

    return result
  }
}
