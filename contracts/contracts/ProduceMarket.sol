// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProduceMarket {
    struct Produce {
        uint256 id;
        string name;
        string category;
        uint256 quantity;
        uint256 basePricePerUnit;
        address payable farmer;
        bool isSold;
    }

    struct Offer {
        address buyer;
        uint256 offeredPricePerUnit;
        bool accepted;
    }

    uint256 public produceCounter;
    mapping(uint256 => Produce) public produces;
    mapping(uint256 => Offer[]) public offers;

    event ProduceListed(uint256 produceId, address indexed farmer);
    event OfferPlaced(uint256 produceId, address indexed buyer, uint256 offer);
    event OfferAccepted(uint256 produceId, address indexed buyer);

    function listProduce(string memory name, string memory category, uint256 quantity, uint256 basePricePerUnit) external {
        produceCounter++;
        produces[produceCounter] = Produce({
            id: produceCounter,
            name: name,
            category: category,
            quantity: quantity,
            basePricePerUnit: basePricePerUnit,
            farmer: payable(msg.sender),
            isSold: false
        });

        emit ProduceListed(produceCounter, msg.sender);
    }

    function placeOffer(uint256 produceId, uint256 offeredPricePerUnit) external {
        require(!produces[produceId].isSold, "Already sold");

        offers[produceId].push(Offer({
            buyer: msg.sender,
            offeredPricePerUnit: offeredPricePerUnit,
            accepted: false
        }));

        emit OfferPlaced(produceId, msg.sender, offeredPricePerUnit);
    }

    function acceptOffer(uint256 produceId, uint256 offerIndex) external {
        Produce storage produce = produces[produceId];
        require(msg.sender == produce.farmer, "Only farmer can accept");
        require(!produce.isSold, "Already sold");

        Offer storage offer = offers[produceId][offerIndex];
        offer.accepted = true;
        produce.isSold = true;

        emit OfferAccepted(produceId, offer.buyer);
    }

    function getOffers(uint256 produceId) external view returns (Offer[] memory) {
        return offers[produceId];
    }
}
