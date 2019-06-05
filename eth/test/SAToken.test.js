const { BN, time } = require('openzeppelin-test-helpers');

const SAToken = artifacts.require('SAToken');

contract('SAToken', function ([_, tokenOwner, otherAccount]) {
  const totalSupply = web3.utils.toWei(new BN(100));

  beforeEach(async function () {
    this.token = await SAToken.new(totalSupply, { from: tokenOwner });
  });

  it('should have 100 ALN minted', async function () {
    (await this.token.totalSupply()).should.be.bignumber.equal(totalSupply);
    (await this.token.balanceOf(tokenOwner)).should.be.bignumber.equal(totalSupply);
  });

});
