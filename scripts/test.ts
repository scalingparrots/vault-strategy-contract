import hardhat from 'hardhat';
import {Contract} from "@ethersproject/contracts";
import {deploy} from "@openzeppelin/hardhat-upgrades/dist/utils";
import {BigNumber} from "ethers";

const { run, ethers, upgrades } = hardhat;

async function main(): Promise<void> {
  await run('compile');
  const [deployer] = await ethers.getSigners();

  const CrvABI = require('../abi/3crv.json');
  let tokenWantAddress = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490" // 3crv // token want // lpToken
  let tokenWantContract : Contract;
  let tokenWantAccountAddress = "0xd632f22692fac7611d2aa1c0d552930d43caed3b";

  // get token want contract // 3crv
  tokenWantContract = new ethers.Contract(tokenWantAddress, CrvABI, ethers.provider);

  console.log(await tokenWantContract.balanceOf(tokenWantAccountAddress))

}
  main()
    .then(() => process.exit(0))
    .catch((error: Error) => {
      console.error(error);
      process.exit(1);
    });

