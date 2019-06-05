pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Super Awesome Token
 */
contract SAToken is Ownable, ERC20, ERC20Detailed {

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor (uint256 totalSupply) public ERC20Detailed("Token", "ALN", 18) {
        _mint(msg.sender, totalSupply);
    }

    /**
     * @dev Execute more tha one transfers to multiple recipents
     *
     */
    function groupTransfer(address[] memory recipients, uint256[] memory amounts) public onlyOwner {
        require(recipients.length == amounts.length, "Invalid length of recipients and amount");
        for (uint i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }

}
