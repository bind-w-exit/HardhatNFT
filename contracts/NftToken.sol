// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Creature is ERC721("My NFT Collection", "MNFTC"), Ownable {
    using Strings for uint256;

    uint256 constant public MAX_SUPPLY = 10;
    string public baseURI;
    uint256 public cost;
    uint256 public totalSupply;

    event SetBaseURI(string newBaseURI);
    event SetCost(uint256 newCost);
    event Buy(address indexed to, uint256 tokenId, uint256 cost);
    event Withdraw(address indexed to, uint256 amount);
    
    
    constructor(string memory initBaseURI) {
        setBaseURI(initBaseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0 ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), ".json")) : "";
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
        emit SetBaseURI(newBaseURI);
    }

    function setCost(uint256 newCost) external onlyOwner {
        cost = newCost;
        emit SetCost(newCost);
    }

    function buy() external payable {
        require(totalSupply + 1 <= MAX_SUPPLY);
        require(msg.value == cost, "NFT: incorrect amount");

        uint256 tokenId = totalSupply++;
        _safeMint(msg.sender, tokenId);
        totalSupply++;

        emit Buy(msg.sender, tokenId, cost);
    }

    function withdraw() external onlyOwner { 
        uint256 amountToSend = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amountToSend}("");
        require(success, "NftToken: unable to withdraw, recipient may have reverted");
        emit Withdraw(msg.sender, amountToSend);
    }
}