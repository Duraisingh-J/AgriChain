// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    enum Status { Pending, Completed, Refunded }

    struct Deal {
        address buyer;
        address payable farmer;
        uint256 amount;
        Status status;
    }

    uint256 public dealCounter;
    mapping(uint256 => Deal) public deals;

    event DealCreated(uint256 dealId, address indexed buyer, address indexed farmer, uint256 amount);
    event DealCompleted(uint256 dealId);
    event DealRefunded(uint256 dealId);

    function createDeal(address payable farmer) external payable returns (uint256) {
        require(msg.value > 0, "Must send payment");

        dealCounter++;
        deals[dealCounter] = Deal({
            buyer: msg.sender,
            farmer: farmer,
            amount: msg.value,
            status: Status.Pending
        });

        emit DealCreated(dealCounter, msg.sender, farmer, msg.value);
        return dealCounter;
    }

    function confirmDelivery(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Pending, "Deal is not pending");
        require(msg.sender == deal.buyer, "Only buyer can confirm");

        deal.status = Status.Completed;
        deal.farmer.transfer(deal.amount);

        emit DealCompleted(dealId);
    }

    function refund(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        require(deal.status == Status.Pending, "Deal is not pending");
        require(msg.sender == deal.farmer, "Only farmer can refund");

        deal.status = Status.Refunded;
        payable(deal.buyer).transfer(deal.amount);

        emit DealRefunded(dealId);
    }

    function getDeal(uint256 dealId) external view returns (
        address buyer,
        address farmer,
        uint256 amount,
        Status status
    ) {
        Deal memory deal = deals[dealId];
        return (deal.buyer, deal.farmer, deal.amount, deal.status);
    }
}
