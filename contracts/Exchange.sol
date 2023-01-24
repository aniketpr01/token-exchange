// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.7;

// import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
    address public feeAccount;
    uint256 public feePercent;
    uint256 public orderCount;
    mapping(address => mapping(address => uint256)) public tokenMapping;
    mapping(uint256 => _Order) public orderMapping;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    // Model for orders
    struct _Order {
        uint256 id; // Unique identifier for all the orders
        address user; // address of the user who made the order
        address tokenBuy; // address of the token that will be bought/received
        uint256 amountBuy; // amount of the token that will be received/Get
        address tokenSell; // address of the token that will be Sold/Given
        uint256 amountSell; // amount of the token that will be Provide/Give
        uint256 timestamp; // To track when order was created
    }

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdrawal(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenBuy,
        uint256 amountBuy,
        address tokenSell,
        uint256 amountSell,
        address creator,
        uint256 timestamp
    );

    // Track Fee Account
    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Deposit Tokens
    function depositToken(address _token, uint256 _amount) public {
        // We need to transfer the tokens to the exchange
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // We need to update the balance of user
        tokenMapping[_token][msg.sender] += _amount;
        // Finally emit the event
        emit Deposit(_token, msg.sender, _amount, tokenMapping[_token][msg.sender]);
    }

    // Withrdaw Tokens
    function withdrawToken(address _token, uint256 _amount) public {
        // verify if user has enough balance to withdraw
        require(tokenMapping[_token][msg.sender] >= _amount, "Insufficient balance");
        // We need to update the balance of user
        tokenMapping[_token][msg.sender] -= _amount;
        // We need to transfer the tokens to the user
        require(Token(_token).transfer(msg.sender, _amount));
        // emit the event
        emit Withdrawal(_token, msg.sender, _amount, tokenMapping[_token][msg.sender]);
    }

    // Check Balances
    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokenMapping[_token][_user];
    }

    // function to Make Order
    function makeOrder(
        address _tokenBuy,
        uint256 _amountbuy,
        address _tokenSell,
        uint256 _amountSell
    ) public {
        // verify if user has enough balance to make order
        // console.log(tokenMapping[_tokenBuy][msg.sender]);
        // console.log(_amountbuy);
        require(tokenMapping[_tokenSell][msg.sender] >= _amountSell, "Insufficient balance");
        orderCount += 1;
        orderMapping[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenBuy,
            _amountbuy,
            _tokenSell,
            _amountSell,
            block.timestamp
        );
        // emit an event
        emit Order(
            orderCount,
            msg.sender,
            _tokenBuy,
            _amountbuy,
            _tokenSell,
            _amountSell,
            block.timestamp
        );
    }

    // function to Cancel Order
    function cancelOrder(uint256 _id) public {
        // Fetch the exising order
        _Order storage _order = orderMapping[_id];
        // verify if the order is valid
        require(address(_order.user) == msg.sender, "Invalid Order");
        // verify if order exists
        require(_order.id == _id, "Order does not exist");
        // Cancel the order
        orderCancelled[_id] = true;
        // emit an event
        emit Cancel(
            _order.id,
            msg.sender,
            _order.tokenBuy,
            _order.amountBuy,
            _order.tokenSell,
            _order.amountSell,
            _order.timestamp
        );
    }

    // function to Fill Order
    function fillOrder(uint256 _id) public {
        // verify valid orderId
        require(_id > 0 && _id <= orderCount, "Invalid Order");
        // Order can't be filled
        require(!orderFilled[_id], "Order Filled");
        // Order can't be cancelled
        require(!orderCancelled[_id], "Order Cancelled");

        // Fetch the exising order
        _Order storage _order = orderMapping[_id];

        // Swap/Trade Tokens
        // user1 will have APT token and want the fDAI token
        // user2 will have fDAI token and want the APT token
        // orders will be placed by both the users
        _trade(
            _order.id,
            _order.user,
            _order.tokenBuy,
            _order.amountBuy,
            _order.tokenSell,
            _order.amountSell
        );

        // Mark the order as filled
        orderFilled[_id] = true;
    }

    function _trade(
        uint256 _orderId,
        address _user,
        address _tokenBuy,
        uint256 _amountBuy,
        address _tokenSell,
        uint256 _amountSell
    ) internal {
        // Fee is paid by the user who will be filling up the order(msg.sender)
        // Fee will be deducted from _amountBuy
        // console.log(_amountBuy);
        uint256 _feeAmount = (_amountBuy * feePercent) / 100;
        // console.log(_feeAmount);

        // Trade logic
        // msg.sender is the user who filled the trade order, while _user is who created the order
        // console.log("---------------------");
        // console.log(_amountBuy);
        // console.log(_feeAmount);
        // console.log(feePercent);
        // console.log(_amountBuy * feePercent);
        // console.log(tokenMapping[_tokenBuy][msg.sender]);
        // console.log(_amountBuy + _feeAmount);
        // console.log("---------------------");
        // console.log(msg.sender);
        // console.log(_user);
        tokenMapping[_tokenBuy][msg.sender] -= _amountBuy + _feeAmount;
        tokenMapping[_tokenBuy][_user] += _amountBuy;

        // Charge the fees
        tokenMapping[_tokenBuy][feeAccount] += _feeAmount;

        tokenMapping[_tokenSell][_user] -= _amountSell;
        tokenMapping[_tokenSell][msg.sender] += _amountSell;

        // emit an event
        emit Trade(
            _orderId,
            _user, // user
            _tokenBuy,
            _amountBuy,
            _tokenSell,
            _amountSell,
            msg.sender, // creator
            block.timestamp
        );
    }
}
