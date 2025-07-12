// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FarmerMarket {
    struct Listing {
        address farmer;
        string name;
        string item;
        uint256 quantity;
        uint256 pricePerKg;
    }

    struct BuyerRequest {
        address buyer;
        string name;
        string item;
        uint256 quantity;
        uint256 pricePerKg;
    }

    Listing[] private listings;
    BuyerRequest[] private buyers;

    event ListingRegistered(address indexed farmer, string item, uint256 quantity, uint256 pricePerKg);
    event BuyerRegistered(address indexed buyer, string item, uint256 quantity, uint256 pricePerKg);

    /// @notice Allows a farmer to register a produce listing
    function registerListing(
        string memory name,
        string memory item,
        uint256 quantity,
        uint256 pricePerKg
    ) external {
        listings.push(Listing({
            farmer: msg.sender,
            name: name,
            item: item,
            quantity: quantity,
            pricePerKg: pricePerKg
        }));

        emit ListingRegistered(msg.sender, item, quantity, pricePerKg);
    }

    /// @notice Allows a buyer to register a buying request
    function registerBuyer(
        string memory name,
        string memory item,
        uint256 quantity,
        uint256 pricePerKg
    ) external {
        buyers.push(BuyerRequest({
            buyer: msg.sender,
            name: name,
            item: item,
            quantity: quantity,
            pricePerKg: pricePerKg
        }));

        emit BuyerRegistered(msg.sender, item, quantity, pricePerKg);
    }

    /// @notice Returns all produce listings
    function getListings() external view returns (Listing[] memory) {
        return listings;
    }

    /// @notice Returns all buyer requests
    function getBuyers() external view returns (BuyerRequest[] memory) {
        return buyers;
    }

    /// @notice Returns best matching listing for a buyer
    function getMatchingListing(
        string memory item,
        uint256 quantity,
        uint256 maxPrice
    ) external view returns (Listing memory) {
        for (uint256 i = 0; i < listings.length; i++) {
            if (
                keccak256(bytes(listings[i].item)) == keccak256(bytes(item)) &&
                listings[i].quantity >= quantity &&
                listings[i].pricePerKg <= maxPrice
            ) {
                return listings[i];
            }
        }
        return Listing(address(0), "", "", 0, 0);
    }

    /// @notice Returns best matching buyer for a farmer
    function getMatchingBuyer(
        string memory item,
        uint256 quantity,
        uint256 minPrice
    ) external view returns (BuyerRequest memory) {
        for (uint256 i = 0; i < buyers.length; i++) {
            if (
                keccak256(bytes(buyers[i].item)) == keccak256(bytes(item)) &&
                buyers[i].quantity >= quantity &&
                buyers[i].pricePerKg >= minPrice
            ) {
                return buyers[i];
            }
        }
        return BuyerRequest(address(0), "", "", 0, 0);
    }
}
