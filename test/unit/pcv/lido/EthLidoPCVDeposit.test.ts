import { expectRevert, getAddresses, getCore } from '@test/helpers';
import { forceSpecificEth } from '@test/integration/setup/utils';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';

const e18 = '000000000000000000';

const toBN = ethers.BigNumber.from;

describe('EthLidoPCVDeposit', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let governorAddress: string;
  let pcvControllerAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, secondUserAddress, governorAddress, pcvControllerAddress } = await getAddresses());

    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.steth = await (await ethers.getContractFactory('MockStEthToken')).deploy();
    this.stableswap = await (await ethers.getContractFactory('MockStEthStableSwap')).deploy(this.steth.address);
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(1);
    await this.steth.mintAt(this.stableswap.address);

    await forceSpecificEth(this.stableswap.address, '10' + ethers.constants.WeiPerEther.toString());

    this.pcvDeposit = await (
      await ethers.getContractFactory('EthLidoPCVDeposit')
    ).deploy(
      this.core.address,
      {
        _oracle: this.oracle.address,
        _backupOracle: '0x0000000000000000000000000000000000000000',
        _invertOraclePrice: false,
        _decimalsNormalizer: '0'
      },
      this.steth.address,
      this.stableswap.address,
      '100' // maximum 1% slippage tolerated
    );
  });

  describe('receive()', function () {
    it('should accept ETH transfers', async function () {
      // send 23 ETH
      await impersonatedSigners[userAddress].sendTransaction({ to: this.pcvDeposit.address, value: toBN(`23${e18}`) });
      expect(await ethers.provider.getBalance(this.pcvDeposit.address)).to.be.equal(`23${e18}`);
    });
  });

  describe('setMaximumSlippage()', function () {
    beforeEach(async function () {
      // grant PCV_MINOR_PARAM_ROLE to governorAddress if it doesn't have it
      const role = '0x46797b318ce8c2d83979760ef100a5c0fdb980de4b574d6142ce4d0afce307ed';
      const governorRole = '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e';
      if (!(await this.core.hasRole(role, governorAddress))) {
        await this.core.connect(impersonatedSigners[governorAddress]).createRole(role, governorRole);
        await this.core.connect(impersonatedSigners[governorAddress]).grantRole(role, governorAddress);
      }
    });

    it('should revert if not governor', async function () {
      await expectRevert(this.pcvDeposit.setMaximumSlippage('500'), 'UNAUTHORIZED');
    });
    it('should revert on invalid value', async function () {
      await expectRevert(
        this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaximumSlippage('10001', {}),
        'EthLidoPCVDeposit: Exceeds bp granularity.'
      );
    });
    it('should emit UpdateMaximumSlippage', async function () {
      expect(await this.pcvDeposit.maximumSlippageBasisPoints()).to.be.equal('100');
      await await expect(await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaximumSlippage('500'))
        .to.emit(this.pcvDeposit, 'UpdateMaximumSlippage')
        .withArgs('500');

      expect(await this.pcvDeposit.maximumSlippageBasisPoints()).to.be.equal('500');
    });
  });

  describe('IPCVDeposit interface override', function () {
    describe('balance()', function () {
      it('should return the amount of stETH held', async function () {
        expect(await this.pcvDeposit.balance()).to.be.equal('0');
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal('0');
        await this.steth.mintAt(this.pcvDeposit.address);
        expect(await this.pcvDeposit.balance()).to.be.equal(`100000${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`100000${e18}`);
      });
    });

    describe('deposit()', function () {
      it('should revert if no ETH is on the contract', async function () {
        expect(await ethers.provider.getBalance(this.pcvDeposit.address)).to.be.equal('0');
        await expectRevert(this.pcvDeposit.deposit(), 'EthLidoPCVDeposit: cannot deposit 0.');
      });
      it('should emit Deposit', async function () {
        await impersonatedSigners[userAddress].sendTransaction({ to: this.pcvDeposit.address, value: toBN(`1${e18}`) });
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal('0');
        await expect(await this.pcvDeposit.deposit())
          .to.emit(this.pcvDeposit, 'Deposit')
          .withArgs(userAddress, `1${e18}`);

        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`1${e18}`);
      });
      it('should use Curve if slippage is negative', async function () {
        await impersonatedSigners[userAddress].sendTransaction({ to: this.pcvDeposit.address, value: toBN(`1${e18}`) });
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal('0');
        await this.stableswap.setSlippage(1000, true); // 10% negative slippage (bonus) for ETH -> stETH
        await this.pcvDeposit.deposit();
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal('1100000000000000000'); // got 1.1 stETH
      });
      it('should directly stake if slippage is positive', async function () {
        await (
          await ethers.getSigner(userAddress)
        ).sendTransaction({ to: this.pcvDeposit.address, value: toBN(`1${e18}`) });
        expect((await this.steth.balanceOf(this.pcvDeposit.address)).toString()).to.be.equal('0');
        await this.stableswap.setSlippage(1000, false); // 10% positive slippage (disadvantage) for ETH -> stETH
        await this.pcvDeposit.deposit();
        // didn't get 0.9 stETH out of a swap Curve, but did a direct 1:1 deposit directly on Lido
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`1${e18}`);
      });
    });

    describe('withdraw()', function () {
      it('should emit Withdrawal', async function () {
        await this.steth.mintAt(this.pcvDeposit.address);
        const balanceBeforeWithdraw = toBN(await ethers.provider.getBalance(secondUserAddress));
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`100000${e18}`);
        await await expect(
          await this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdraw(secondUserAddress, `1${e18}`, {})
        )
          .to.emit(this.pcvDeposit, 'Withdrawal')
          .withArgs(pcvControllerAddress, secondUserAddress, `1${e18}`);

        const balanceAfterWithdraw = toBN(await ethers.provider.getBalance(secondUserAddress));
        expect(balanceAfterWithdraw.sub(balanceBeforeWithdraw)).to.be.equal(`1${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`99999${e18}`);
      });

      it('should revert if slippage is too high', async function () {
        await this.steth.mintAt(this.pcvDeposit.address);
        await this.stableswap.setSlippage(1000, false); // 10% positive slippage (disavantage) for stETH -> ETH
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, `1${e18}`, {}),
          'MockStableswap/excess-slippage'
        );
      });

      it('should revert if trying to withdraw more than balance', async function () {
        await this.steth.mintAt(this.pcvDeposit.address);
        await expectRevert(
          this.pcvDeposit.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, `100001${e18}`, {}),
          'EthLidoPCVDeposit: not enough stETH.'
        );
      });
      it('should revert if not PCVController', async function () {
        await expectRevert(this.pcvDeposit.withdraw(userAddress, 1), 'CoreRef: Caller is not a PCV controller');
      });
    });

    describe('withdrawERC20()', function () {
      it('should emit WithdrawERC20', async function () {
        await this.steth.mintAt(this.pcvDeposit.address);
        expect(await this.steth.balanceOf(secondUserAddress)).to.be.equal('0');
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`100000${e18}`);
        await expect(
          await this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawERC20(this.steth.address, secondUserAddress, `1${e18}`, {})
        )
          .to.emit(this.pcvDeposit, 'WithdrawERC20')
          .withArgs(pcvControllerAddress, this.steth.address, secondUserAddress, `1${e18}`);
        expect(await this.steth.balanceOf(secondUserAddress)).to.be.equal(`1${e18}`);
        expect(await this.steth.balanceOf(this.pcvDeposit.address)).to.be.equal(`99999${e18}`);
      });
      it('should revert if not PCVController', async function () {
        await expectRevert(
          this.pcvDeposit.withdrawERC20(this.fei.address, userAddress, 1),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });
  });

  describe('withdrawETH()', function () {
    it('should emit WithdrawETH', async function () {
      const balanceBeforeWithdraw = toBN((await ethers.provider.getBalance(secondUserAddress)).toString());
      await (
        await ethers.getSigner(userAddress)
      ).sendTransaction({ to: this.pcvDeposit.address, value: toBN(`1${e18}`) });
      await await expect(
        await this.pcvDeposit
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawETH(secondUserAddress, `1${e18}`)
      )
        .to.emit(this.pcvDeposit, 'WithdrawETH')
        .withArgs(pcvControllerAddress, secondUserAddress, `1${e18}`);

      const balanceAfterWithdraw = toBN((await ethers.provider.getBalance(secondUserAddress)).toString());
      expect(balanceAfterWithdraw.sub(balanceBeforeWithdraw).toString()).to.be.equal(`1${e18}`);
    });
    it('should revert if trying to withdraw more than balance', async function () {
      await expectRevert(
        this.pcvDeposit.connect(impersonatedSigners[pcvControllerAddress]).withdrawETH(userAddress, `100001${e18}`, {}),
        'Address: insufficient balance'
      );
    });
    it('should revert if not PCVController', async function () {
      await expectRevert(this.pcvDeposit.withdraw(userAddress, 1), 'CoreRef: Caller is not a PCV controller');
    });
  });
});
