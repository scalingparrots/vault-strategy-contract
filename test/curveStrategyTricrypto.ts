import hardhat from "hardhat";
import { expect } from 'chai';
import { Contract } from "@ethersproject/contracts";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {deployContract} from "ethereum-waffle";

const { ethers, upgrades, network } = hardhat;

let tokensVault : Contract;
let curveStrategyCurve: Contract;
let crvContract: Contract;

//let pool = "0x80466c64868e1ab14a1ddf27a676c3fcbe638fe5" // Curve.fi: TriCrypto
let pool = "0xd51a44d3fae010294c616388b506acda1bfaae46" // Curve.fi: TriCrypto

let liquidityGauge= "0xdefd8fdd20e0f34115c7018ccfb655796f6b2168" // Gauge Deposit tricrypto
let uniswapRouter02 = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
let crvAddress = "0xD533a949740bb3306d119CC777fa900bA034cd52"
let crv3CryptoAddress = "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff" // crv3crypto
let wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
let usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
let daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
let usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"


const TreCrvABI = require('../abi/3crv.json');
const crvABI = require('../abi/crv.json');
let tokenWantAddress = "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff" // crv3crypto // token want // lpToken // usd/btc/eth
let tokenWantContract : Contract;

let tokenWantAccountAddress1 = "0xa019a71f73922f5170031f99efc37f31d3020f0b";
let tokenWantAccountAddress2 = "0xe5447efebb597267d6afe9c53e0aeaba7e617fa8";
let tokenWantAccountAddress3 = "0x956e385cf932bc32657c005f8b3a4130cb55dc7f";

let tokenWantAccount1 : SignerWithAddress;
let tokenWantAccount2 : SignerWithAddress;
let tokenWantAccount3 : SignerWithAddress;

let deployer : SignerWithAddress;
let account1 : SignerWithAddress;
let account2 : SignerWithAddress;
before(async function() {
    [deployer, account1, account2] = await ethers.getSigners();

    // get account with token want // 3crv
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [tokenWantAccountAddress1],
    });
    tokenWantAccount1 = await ethers.getSigner(tokenWantAccountAddress1);

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [tokenWantAccountAddress2],
    });
    tokenWantAccount2 = await ethers.getSigner(tokenWantAccountAddress2);

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [tokenWantAccountAddress3],
    });
    tokenWantAccount3 = await ethers.getSigner(tokenWantAccountAddress3);

    // fund token want account
    // Send BNB to lp owners
    await deployer.sendTransaction({
        to: tokenWantAccount1.address,
        value: ethers.utils.parseEther("1.0")
    });

    // fund token want account
    // Send BNB to lp owners
    await deployer.sendTransaction({
        to: tokenWantAccount2.address,
        value: ethers.utils.parseEther("1.0")
    });

    // fund token want account
    // Send BNB to lp owners
    await deployer.sendTransaction({
        to: tokenWantAccount3.address,
        value: ethers.utils.parseEther("1.0")
    });

    // get token want contract // 3crv
    tokenWantContract = new ethers.Contract(tokenWantAddress, TreCrvABI, ethers.provider);

    crvContract = new ethers.Contract(crvAddress, crvABI, ethers.provider);

    console.log("crvContract: ", crvContract.address);

    console.log("Deploy with account: ", deployer.address);

    // deploy strategy curve
    let tokensStrategyCurve: any = await ethers.getContractFactory("StrategyCurveLP");
    curveStrategyCurve = await tokensStrategyCurve.deploy(
        tokenWantAddress,
        ethers.constants.AddressZero,
        liquidityGauge,
        pool,
        2,
        0,
        true,
        false,
        [crvAddress, wethAddress],
        [wethAddress, usdtAddress],
        deployer.address)

    await curveStrategyCurve.deployed();

    console.log("Curve strategy deployed to : ", curveStrategyCurve.address);

    // set withdrawal fee
    let tx = await curveStrategyCurve.setWithdrawalFee(0);
    await tx.wait();

    // deploy tokens vault
    let factorytokensVault = await ethers.getContractFactory("tokensVaultV1")
    tokensVault = await upgrades.deployProxy(factorytokensVault, [
        curveStrategyCurve.address,
        "tokensVault",
        "SCV",
        21600
    ]);
    await tokensVault.deployed();

    console.log("tokensVault deployed to address: ", tokensVault.address)

    tx = await curveStrategyCurve.setVault(tokensVault.address);
    await tx.wait();
})

describe("Testing tokensVault tricrypto...", async () => {
    let amountToDeposit1: any;
    let amountToDeposit2: any;
    let amountToDeposit3: any;
    let balanceOfWantBeforeDeposit1: any;
    let balanceOfWantBeforeDeposit2: any;
    let balanceOfWantBeforeDeposit3: any;
    let balanceOfWantAfterDeposit1: any;
    let balanceOfWantAfterDeposit2: any;
    let balanceOfWantAfterDeposit3: any;
    let balanceOfWantBeforeWithdraw1: any;
    let balanceOfWantBeforeWithdraw2: any;
    let balanceOfWantBeforeWithdraw3: any;
    let balanceOfWantAfterWithdraw1: any;
    let balanceOfWantAfterWithdraw2: any;
    let balanceOfWantAfterWithdraw3: any;

    it('should call deposit of vault with account 1', async () => {

        console.log("ACCOUNT 1")
        balanceOfWantBeforeDeposit1 = await tokenWantContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeDeposit1));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount1.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        let tx = await tokenWantContract.connect(tokenWantAccount1).approve(tokensVault.address, balanceOfWantBeforeDeposit1);
        await tx.wait();

        console.log("Approve done")

        amountToDeposit1 = balanceOfWantBeforeDeposit1;
        console.log("Amount to deposit: ", ethers.utils.formatEther(amountToDeposit1))

        console.log("Block before deposit: ", await ethers.provider.getBlockNumber())


        let balanceOfLiquidityGaugeBefore = await tokenWantContract.balanceOf(liquidityGauge)

        tx = await tokensVault.connect(tokenWantAccount1).deposit(amountToDeposit1);
        await tx.wait();

        balanceOfWantAfterDeposit1 = await tokenWantContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterDeposit1));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount1.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        let balanceOfStrategyAfterDeposit1 = await tokenWantContract.balanceOf(curveStrategyCurve.address);
        console.log("Balance of strategy: " , ethers.utils.formatEther(balanceOfStrategyAfterDeposit1));

        let balanceOfLiquidityGaugeAfter = await tokenWantContract.balanceOf(liquidityGauge)
        console.log("Amount deposit to liquidity gauge: " , ethers.utils.formatEther(balanceOfLiquidityGaugeAfter.sub(balanceOfLiquidityGaugeBefore)));

    });

    it('should mine some block', async () => {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        let newTimestamp = block.timestamp + 1000000
        for (let i = 0; i < 5000; i++) {
            newTimestamp = newTimestamp + 100
            await ethers.provider.send('evm_mine', [newTimestamp]);
        }

    });

    it('should call deposit of vault with account 2', async () => {

        console.log("ACCOUNT 2")

        balanceOfWantBeforeDeposit2 = await tokenWantContract.balanceOf(tokenWantAccount2.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeDeposit2));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount2.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        let tx = await tokenWantContract.connect(tokenWantAccount2).approve(tokensVault.address, balanceOfWantBeforeDeposit2);
        await tx.wait();

        console.log("Approve done")

        amountToDeposit2 = balanceOfWantBeforeDeposit2;
        console.log("Amount to deposit: ", ethers.utils.formatEther(amountToDeposit2))

        console.log("Block before deposit: ", await ethers.provider.getBlockNumber())

        tx = await tokensVault.connect(tokenWantAccount2).deposit(amountToDeposit2);
        await tx.wait();

        balanceOfWantAfterDeposit2 = await tokenWantContract.balanceOf(tokenWantAccount2.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterDeposit2));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount2.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

    });

    it('should mine some block', async () => {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        let newTimestamp = block.timestamp + 1000000

        for (let i = 0; i < 5000; i++) {
            newTimestamp = newTimestamp + 100
            await ethers.provider.send('evm_mine', [newTimestamp]);
        }

    });

    it('should call deposit of vault with account 3', async () => {

        console.log("ACCOUNT 3")

        balanceOfWantBeforeDeposit3 = await tokenWantContract.balanceOf(tokenWantAccount3.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeDeposit3));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount3.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        let tx = await tokenWantContract.connect(tokenWantAccount3).approve(tokensVault.address, balanceOfWantBeforeDeposit3);
        await tx.wait();

        console.log("Approve done")

        amountToDeposit3 = balanceOfWantBeforeDeposit3;
        console.log("Amount to deposit: ", ethers.utils.formatEther(amountToDeposit3))

        console.log("Block before deposit: ", await ethers.provider.getBlockNumber())

        tx = await tokensVault.connect(tokenWantAccount3).deposit(amountToDeposit3);
        await tx.wait();

        balanceOfWantAfterDeposit3 = await tokenWantContract.balanceOf(tokenWantAccount3.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterDeposit3));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount3.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

    });

    it('should mine some block', async () => {
        let blockNumber = await ethers.provider.getBlockNumber();
        let block = await ethers.provider.getBlock(blockNumber);
        let newTimestamp = block.timestamp + 1000000

        for (let i = 0; i < 5000; i++) {
            newTimestamp = newTimestamp + 100
            await ethers.provider.send('evm_mine', [newTimestamp]);
        }

    });

    it('should call harvest in strategy contract', async () => {
        let tx = await curveStrategyCurve.connect(account1).harvest();
        await tx.wait();
    });

    it('should call withdraw of vault with account 1', async () => {
        console.log("WITHDRAW START")

        let rewardAvailable = await curveStrategyCurve.rewardsAvailable();
        console.log("Rewards available: " , ethers.utils.formatEther(rewardAvailable));

        balanceOfWantBeforeWithdraw1 = await tokenWantContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeWithdraw1));

        let balanceCRVBeforeWithdraw = await crvContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of crv before withdraw: " , ethers.utils.formatEther(balanceCRVBeforeWithdraw));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount1.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Block before withdraw: ", await ethers.provider.getBlockNumber())

        let tx = await tokensVault.connect(tokenWantAccount1).withdraw(amountToDeposit1);
        await tx.wait();

        balanceOfWantAfterWithdraw1 = await tokenWantContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterWithdraw1));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount1.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Diff want: ", ethers.utils.formatEther(balanceOfWantAfterWithdraw1.sub(balanceOfWantBeforeDeposit1)))

        let balanceCRVAfterWithdraw = await crvContract.balanceOf(tokenWantAccount1.address);
        console.log("Balance of crv after withdraw: " , ethers.utils.formatEther(balanceCRVAfterWithdraw));

        console.log("Diff crv: ", ethers.utils.formatEther(balanceCRVAfterWithdraw.sub(balanceCRVBeforeWithdraw)))

    });


    it('should call harvest in strategy contract', async () => {
        let tx = await curveStrategyCurve.connect(account1).harvest();
        await tx.wait();
    });

    it('should call withdraw of vault with account 2', async () => {

        balanceOfWantBeforeWithdraw2 = await tokenWantContract.balanceOf(tokenWantAccount2.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeWithdraw2));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount2.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Block before withdraw: ", await ethers.provider.getBlockNumber())

        let tx = await tokensVault.connect(tokenWantAccount2).withdraw(amountToDeposit2);
        await tx.wait();

        balanceOfWantAfterWithdraw2 = await tokenWantContract.balanceOf(tokenWantAccount2.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterWithdraw2));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount2.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Diff want: ", ethers.utils.formatEther(balanceOfWantAfterWithdraw2.sub(balanceOfWantBeforeDeposit2)))

    });


    it('should call harvest in strategy contract', async () => {
        let tx = await curveStrategyCurve.connect(account1).harvest();
        await tx.wait();
    });

    it('should call withdraw of vault with account 2', async () => {

        balanceOfWantBeforeWithdraw3 = await tokenWantContract.balanceOf(tokenWantAccount3.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantBeforeWithdraw3));

        let balanceOfVault = await tokensVault.balanceOf(tokenWantAccount3.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Block before withdraw: ", await ethers.provider.getBlockNumber())

        let tx = await tokensVault.connect(tokenWantAccount3).withdraw(amountToDeposit3);
        await tx.wait();

        balanceOfWantAfterWithdraw3 = await tokenWantContract.balanceOf(tokenWantAccount3.address);
        console.log("Balance of want: " , ethers.utils.formatEther(balanceOfWantAfterWithdraw3));

        balanceOfVault = await tokensVault.balanceOf(tokenWantAccount3.address);
        console.log("Balance of vault: " , ethers.utils.formatEther(balanceOfVault));

        console.log("Diff want: ", ethers.utils.formatEther(balanceOfWantAfterWithdraw3.sub(balanceOfWantBeforeDeposit3)))

    });
});
