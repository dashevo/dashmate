// eslint-disable-next-line import/no-extraneous-dependencies
const { expect, use } = require('chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const dirtyChai = require('dirty-chai');
// eslint-disable-next-line import/no-extraneous-dependencies
const chaiAsPromised = require('chai-as-promised');

use(chaiAsPromised);
use(dirtyChai);

global.expect = expect;
