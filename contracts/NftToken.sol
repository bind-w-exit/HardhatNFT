// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NftToken is ERC721("My NFT Collection", "MNFTC"), Ownable {
    using Strings for uint256;

    uint256 constant public MAX_SUPPLY = 10;
    string public baseURI;
    uint256 public cost;
    uint256 public totalSupply;

    event SetBaseURI(string newBaseURI);
    event SetCost(uint256 newCost);
    event Buy(address indexed to, uint256 tokenId, uint256 cost);
    event Withdraw(address indexed to, uint256 amount);
    
    /**
     * @dev Initializes the base link and initial cost
     *
     * @param initBaseURI Base URI
     * @param initCost Initial cost
     */
    constructor(string memory initBaseURI, uint256 initCost) {
        setBaseURI(initBaseURI);
        setCost(initCost);
    }

    /**
     * @dev Override basic function that returns a base URI.
     * Without parameters.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * @dev Override basic function that returns a token Uniform Resource Identifier (URI)
     *
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0 ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), ".json")) : "";
    }

    /**
     * @dev Sets a new base URI
     * Can only be called by the current owner.
     *
     * Emits an {SetBaseURI} event that indicates that the base URI has changed
     * @param newBaseUri New base URI
     */
    function setBaseURI(string memory newBaseUri) public onlyOwner {
        baseURI = newBaseUri;
        emit SetBaseURI(newBaseUri);
    }

    /**
     * @dev Sets a new NFT cost
     * Can only be called by the current owner.
     *
     * Emits an {SetCost} event that indicates that the NFT cost has changed
     * @param newCost New NFT cost
     */
    function setCost(uint256 newCost) public onlyOwner {
        cost = newCost;
        emit SetCost(newCost);
    }

    /**
     * @dev Minting the new NFT to the user's address.
     *
     * Emits an {Buy} event that indicates that the NFT has sold
     * Without parameters.
     */
    function buy() external payable {
        require(totalSupply + 1 <= MAX_SUPPLY, "NFT: max total supply exceeded");
        require(msg.value == cost, "NFT: incorrect amount");

        uint256 tokenId = totalSupply + 1;
        _safeMint(msg.sender, tokenId);
        totalSupply++;

        emit Buy(msg.sender, tokenId, cost);
    }

    /**
     * @dev Transfers all earned ether to the owner
     * Can only be called by the current owner.
     *
     * Emits an {WithdrawEther} event that indicates to what address and how many ether were withdrawn from the contract.
     * Without parameters.
     */
    function withdraw() external onlyOwner { 
        uint256 amountToSend = address(this).balance;
        require(amountToSend > 0, "NFT: no ether in the contact");

        (bool success, ) = payable(msg.sender).call{value: amountToSend}("");
        require(success, "NFT: unable to withdraw, recipient may have reverted");

        emit Withdraw(msg.sender, amountToSend);
    }
}