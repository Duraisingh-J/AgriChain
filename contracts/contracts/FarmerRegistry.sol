// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FarmerRegistry {
    struct Farmer {
        string name;
        string location;
        uint8 rating;
        uint256 ratingCount;
        bool isRegistered;
    }

    mapping(address => Farmer) public farmers;

    event FarmerRegistered(address indexed farmer, string name);
    event FarmerRated(address indexed farmer, uint8 newRating);

    modifier onlyRegisteredFarmer() {
        require(farmers[msg.sender].isRegistered, "Not registered");
        _;
    }

    function registerFarmer(string memory name, string memory location) external {
        require(!farmers[msg.sender].isRegistered, "Already registered");

        farmers[msg.sender] = Farmer({
            name: name,
            location: location,
            rating: 0,
            ratingCount: 0,
            isRegistered: true
        });

        emit FarmerRegistered(msg.sender, name);
    }

    function rateFarmer(address farmerAddress, uint8 rating) external {
        require(farmers[farmerAddress].isRegistered, "Farmer not found");
        require(rating >= 1 && rating <= 5, "Rating must be 1 to 5");

        Farmer storage farmer = farmers[farmerAddress];
        farmer.rating = uint8((farmer.rating * farmer.ratingCount + rating) / (farmer.ratingCount + 1));
        farmer.ratingCount++;

        emit FarmerRated(farmerAddress, rating);
    }

    function getFarmer(address farmerAddress) external view returns (Farmer memory) {
        return farmers[farmerAddress];
    }
}
