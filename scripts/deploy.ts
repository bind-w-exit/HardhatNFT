import { ethers } from "hardhat";
import { Contract, ContractFactory, BigNumber } from "ethers";

async function main() {
  const BASE_URI: string = "https://ipfs.io/ipfs/QmTrjsP7zCF47anH6kBLgAmjjwd769p5PS8ffyfVUJtpCf/"
  const INITIAL_COST: BigNumber = ethers.utils.parseEther("0.01");

  const NftToken = await ethers.getContractFactory("NftToken");
  const nftToken = await NftToken.deploy(BASE_URI, INITIAL_COST);

  await nftToken.deployed();

  console.log("NFT deployed to:", nftToken.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
