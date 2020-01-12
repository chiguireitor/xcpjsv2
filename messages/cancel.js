const ID = Buffer.from([70])

module.exports = {
  compose: (source, offerHash) => {
    return Buffer.concat([
      ID,
      Buffer.from(offerHash, 'hex')
    ])
  }
}
