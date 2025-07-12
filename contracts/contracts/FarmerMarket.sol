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

    Listing[] private listings;

    event ListingRegistered(address indexed farmer, string item, uint256 quantity, uint256 pricePerKg);

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

    /// @notice Returns all listings
    function getListings() external view returns (Listing[] memory) {
        return listings;
    }

    /// @notice Returns the best matching listing based on item, quantity, and max price
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

        // Return an empty listing if no match
        return Listing(address(0), "", "", 0, 0);
    }
}
