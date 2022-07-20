import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect, should } from "chai";
import { Contract, ContractFactory, BigNumber } from "ethers";
import { ethers } from "hardhat";

const {
    expectRevert,
    snapshot
} = require("@openzeppelin/test-helpers");

require("chai")
    .should();

describe("NFT Token", function () {
    //contract's constants
    const MAX_SUPPLY: BigNumber = BigNumber.from(10);

    //test's constants
    const AMOUNT: BigNumber = ethers.utils.parseEther("100000");
    const BASE_URI: string = "https://ipfs.io/ipfs/QmTrjsP7zCF47anH6kBLgAmjjwd769p5PS8ffyfVUJtpCf/"
    const INITIAL_COST: BigNumber = ethers.utils.parseEther("0.01");
    
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    let NftToken: ContractFactory;
    let nftToken: Contract;

    let snapshotA: any;
    let snapshotB: any;


    before(async function () {
        snapshotA = await snapshot();

        [owner, user1, user2, user3] = await ethers.getSigners();

        NftToken = await ethers.getContractFactory("NftToken");
        nftToken = await NftToken.deploy(BASE_URI, INITIAL_COST);

        snapshotB = await snapshot();
    });

    after(async function () {
        await snapshotA.restore(); 
    });

    describe("NFT Token Test Cases", function () {

        describe("NFT Token Deploy Test Cases 🏗️", function () {
    
            it("should deploy with correct owner", async () => {
                expect(await nftToken.owner()).to.equal(owner.address);
            });

            it("should deploy with correct constants", async () => {
                expect(await nftToken.MAX_SUPPLY()).to.equal(MAX_SUPPLY);    
            });

            it("should deploy with correct baseURI", async () => {
                expect(await nftToken.baseURI()).to.equal(BASE_URI);    
            });

            it("should deploy with correct initial сost", async () => {
                expect(await nftToken.cost()).to.equal(INITIAL_COST);    
            });

        });

        describe("Vesting Contract Owner Test Cases 👮", function () {

            after(async function () {
                await snapshotB.restore();
            });

            it("should change baseURI", async () => {
                let newBaseUri = "https://ipfs.io/ipfs/1/"

                const tx = await nftToken.setBaseURI(newBaseUri);
                await expect(tx).to.emit(
                    nftToken,
                  "SetBaseURI"
                ).withArgs(
                    newBaseUri
                );

                expect(await nftToken.baseURI()).to.equal(newBaseUri); 
            });

            it("shouldn't change baseURI from the non-current owner", async () => {
                let newBaseUri = "https://ipfs.io/ipfs/1/"

                await expectRevert(
                    nftToken.connect(user1).setBaseURI(newBaseUri),
                    "Ownable: caller is not the owner"
                );
            });

            it("should change NFT cost", async () => {
                let newCost = ethers.utils.parseEther("0.02");

                const tx = await nftToken.setCost(newCost);  
                await expect(tx).to.emit(
                    nftToken,
                  "SetCost"
                ).withArgs(
                    newCost
                );

                expect(await nftToken.cost()).to.equal(newCost); 
            });

            it("shouldn't change baseURI from the non-current owner", async () => {
                let newCost = ethers.utils.parseEther("0.02");

                await expectRevert(
                    nftToken.connect(user1).setCost(newCost),
                    "Ownable: caller is not the owner"
                );
            });

        });

        describe("Vesting Contract Buy 💵 and Withdraw 💳 Test Cases", function () {

            let tokenId = BigNumber.from(1);

            after(async function () {
                await snapshotB.restore();
            });

            it("should sell NFT to the user", async () => {
                const tx = await nftToken.connect(user1).buy({value: INITIAL_COST});
                await expect(tx).to.emit(
                    nftToken,
                  "Buy"
                ).withArgs(
                    user1.address,
                    tokenId,
                    INITIAL_COST
                );

                expect(await nftToken.balanceOf(user1.address)).to.equal(tokenId); 
                expect(await nftToken.ownerOf(tokenId)).to.equal(user1.address); 
                tokenId = tokenId.add(1);
            });

            it("shouldn't sell NFT to the user if incorrect amount sent", async () => {
                await expectRevert(
                    nftToken.connect(user1).buy({value: INITIAL_COST.add(1337)}),
                    "NFT: incorrect amount"
                );
            });
            
            it("should sell all remaining NFTs to the user", async () => {          //IMPROVE 😶‍🌫️
                for(; tokenId.lte(MAX_SUPPLY); tokenId = tokenId.add(1)){
                    await nftToken.connect(user2).buy({value: INITIAL_COST});
                }

                expect(await nftToken.balanceOf(user2.address)).to.equal(MAX_SUPPLY.sub(1)); 
            });

            it("shouldn't sell NFT to the user if max total supply exceeded", async () => {
                await expectRevert(
                    nftToken.connect(user3).buy({value: INITIAL_COST}),
                    "NFT: max total supply exceeded"
                );
            });

            it("should withdraw all ether from contract", async () => {
                let ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
                let contractBalanceBefore = await ethers.provider.getBalance(nftToken.address);
                let amount = INITIAL_COST.mul(MAX_SUPPLY);

                expect(contractBalanceBefore).to.equal(amount);

                const tx = await nftToken.withdraw();    
                await expect(tx).to.emit(
                    nftToken,
                  "Withdraw"
                ).withArgs(
                    owner.address,
                    amount
                );
                const receipt = await tx.wait();

                let fee = tx.gasPrice.mul(receipt.gasUsed);
                let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
                let contractBalanceAfter= await ethers.provider.getBalance(nftToken.address);

                expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(amount).sub(fee));
                expect(contractBalanceAfter).to.equal(0);
            });

            it("should withdraw all ether if no ether in the contact", async () => {
                await expectRevert(
                    nftToken.withdraw(),
                    "NFT: no ether in the contact"
                ); 
            });

            it("should return token URI", async () => {
                expect(await nftToken.tokenURI(1)).to.equal(BASE_URI + 1 + ".json")   
            });

            it("shouldn't return token URI if token doesn't exist", async () => {
                await expectRevert(
                    nftToken.tokenURI(MAX_SUPPLY.add(1)),
                    "ERC721: invalid token ID"
                ); 
            });
        });
    });
});