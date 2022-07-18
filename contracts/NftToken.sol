// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Creature is ERC721("My NFT", "MNFT"), Ownable {

    mapping(uint256 => string) contentIdentifiers;
    uint256 public nftPrice;
    uint256 public lastTokenId;
    
    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/";
    }

    function _mint(address to, string calldata contentIdentifier) internal {
        uint256 tokenId = lastTokenId++;
        _safeMint(to, tokenId);
        contentIdentifiers[tokenId] = contentIdentifier;
        lastTokenId++;
    }

    function mint(address to, string calldata contentIdentifier) external onlyOwner {
        _mint(to, contentIdentifier);
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        contentIdentifiers[tokenId] = "";
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        string memory contentIdentifier = contentIdentifiers[tokenId];

        if(bytes(baseURI).length > 0 || bytes(contentIdentifier).length > 0) {
            return string(abi.encodePacked(baseURI, contentIdentifier));
        } else {
            return "";
        }
    }

    function setNftPrice(uint256 price) external onlyOwner {
        nftPrice = price;
    }

    function buy(string calldata contentIdentifier) external payable {
        require(msg.value == nftPrice, "NFT: incorrect amount");
        _mint(msg.sender, contentIdentifier);
    }

}