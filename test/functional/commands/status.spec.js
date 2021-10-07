const exec = require('../../../src/test/exec');

describe('status', () => {
  describe('core', () => {
    it('should return correct height', async function test() {
      this.timeout(30000);

      const result = await exec('./bin/dashmate status:core --config=local_1', { timeout: 30000 });

      const indexOfBlockHeight = result.indexOf('Block height');
      const stringAfterHeight = result.substring(indexOfBlockHeight);
      const matchD = stringAfterHeight.match(/(\d+)/);

      const height = Number(matchD[0]);

      expect(height).to.be.greaterThan(100);
    });
  });
});
