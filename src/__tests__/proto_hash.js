const { getProtoFilesHash } = require('../helper/version')

describe('proto buffer definitions', () => {
  it('didn\'t change', () => {
    expect(getProtoFilesHash()).toBe('08fccdb16d4aed864229f305a6f866ddd810dcabd37e5df4bca6bea89052db92')
  })
})
