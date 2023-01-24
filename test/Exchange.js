const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Exchange", () => {
    let deployer, feeAccount, accounts, exchange, user1, token1, token2, user2

    const feePercent = 10

    beforeEach(async () => {
        const Exchange = await ethers.getContractFactory("Exchange")
        const Token = await ethers.getContractFactory("Token")

        token1 = await Token.deploy("Aniket Prajapati Token", "APT", "1000000")
        token2 = await Token.deploy("Fake Dai", "fDAI", "1000000")
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]
        exchange = await Exchange.deploy(feeAccount.address, feePercent)
    })

    describe("Deployment", () => {
        it("should track the fee account ", async () => {
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })
        it("should track the fee percentage ", async () => {
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
    })
    describe("Depositing Tokens to Exchange", () => {
        let tx, receipt
        let amount = tokens(10)
        beforeEach(async () => {
            // First approve tokens
            // Connecting to the token1 contract using user1 account
            // Approving the exchange contract to transfer a certain amount
            // of tokens(10 tokens in this case) from user1's token1 balance.
            tx = await token1.connect(user1).approve(exchange.address, amount)
            receipt = await tx.wait()

            // Depositing token to user1 balance from the deployer account
            tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
            receipt = await tx.wait()

            // Deposit tokens
            // Connecting to the exchange contract using user1 account
            // Depositing 10 tokens from user1's token1 balance to the exchange
            tx = await exchange.connect(user1).depositToken(token1.address, amount)
            // waiting for the transcript receipt
            receipt = await tx.wait()

            // accounts = await ethers.getSigners()
            // deployer = accounts[0]
            // feeAccount = accounts[1]
            // const Exchange = await ethers.getContractFactory("Exchange")
            // exchange = await Exchange.deploy(feeAccount.address, feePercent)
        })
        describe("Success", () => {
            it("tracks the token deposit", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokenMapping(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
            })
            it("should emit a Deposit event", async () => {
                const event = receipt.events[1]
                expect(event.event).to.equal("Deposit")

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(amount)
                // expect(receipt.events[0].event).to.equal("Deposit")
                // expect(receipt.events[0].args.token).to.equal(token1.address)
                // expect(receipt.events[0].args.user).to.equal(user1.address)
                // expect(receipt.events[0].args.amount).to.equal(amount)
                // expect(receipt.events[0].args.balance).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("should fail when no tokens are approved", async () => {
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be
                    .reverted
            })
        })
    })

    describe("Withdrawing Tokens from Exchange", () => {
        let tx, receipt
        let amount = tokens(10)
        beforeEach(async () => {
            // need to deposit tokens before withdrawing
            // First approve tokens
            // Connecting to the token1 contract using user1 account
            // Approving the exchange contract to transfer a certain amount
            // of tokens(10 tokens in this case) from user1's token1 balance.
            tx = await token1.connect(user1).approve(exchange.address, amount)
            receipt = await tx.wait()

            // Depositing token to user1 balance from the deployer account
            tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
            receipt = await tx.wait()

            // Deposit tokens
            // Connecting to the exchange contract using user1 account
            // Depositing 10 tokens from user1's token1 balance to the exchange
            tx = await exchange.connect(user1).depositToken(token1.address, amount)
            // waiting for the transcript receipt
            receipt = await tx.wait()

            // withdrawing tokens
            tx = await exchange.connect(user1).withdrawToken(token1.address, amount)
            receipt = await tx.wait()

            // accounts = await ethers.getSigners()
            // deployer = accounts[0]
            // feeAccount = accounts[1]
            // const Exchange = await ethers.getContractFactory("Exchange")
            // exchange = await Exchange.deploy(feeAccount.address, feePercent)
        })
        describe("Success", () => {
            it("should track the token withdrawal", async () => {
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokenMapping(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)
            })
            it("should emit a Withdrawal event", async () => {
                const event = receipt.events[1]
                expect(event.event).to.equal("Withdrawal")

                const args = event.args
                expect(args.token).to.equal(token1.address)
                expect(args.user).to.equal(user1.address)
                expect(args.amount).to.equal(amount)
                expect(args.balance).to.equal(0)
            })
        })
        describe("Failure", () => {
            it("should fail for insufficient balance", async () => {
                // attempting to withdraw tokens without depositing
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be
                    .reverted
            })
        })
    })

    describe("Check Balance", () => {
        let tx
        let amount = tokens(1)
        beforeEach(async () => {
            // First approve tokens
            // Connecting to the token1 contract using user1 account
            // Approving the exchange contract to transfer a certain amount
            // of tokens(10 tokens in this case) from user1's token1 balance.
            tx = await token1.connect(user1).approve(exchange.address, amount)
            await tx.wait()

            // Depositing token to user1 balance from the deployer account
            tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
            await tx.wait()

            // Deposit tokens
            // Connecting to the exchange contract using user1 account
            // Depositing 10 tokens from user1's token1 balance to the exchange
            tx = await exchange.connect(user1).depositToken(token1.address, amount)
            // waiting for the transcript receipt
            await tx.wait()
        })
        it("should return the user balance", async () => {
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)
        })
    })
    describe("Making orders", async () => {
        let tx, receipt
        let amount = tokens(1)
        describe("Success", async () => {
            beforeEach(async () => {
                // Depositing tokens before making Order
                tx = await token1.connect(user1).approve(exchange.address, amount)
                receipt = await tx.wait()
                tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
                receipt = await tx.wait()

                tx = await exchange.connect(user1).depositToken(token1.address, amount)
                receipt = await tx.wait()
                // tx = await token2.connect(user2).approve(exchange.address, amount)
                // receipt = await tx.wait()
                // tx = await exchange.connect(user2).depositToken(token2.address, amount)
                // receipt = await tx.wait()
                // Make an order
                tx = await exchange
                    .connect(user1)
                    .makeOrder(token2.address, amount, token1.address, amount)
                receipt = await tx.wait()
            })
            it("should track the newly created order", async () => {
                const orderCount = await exchange.orderCount()
                expect(orderCount).to.equal(1)

                // const order = await exchange.orderMapping(1)
                // expect(order.id).to.equal(1)
                // expect(order.user).to.equal(user1.address)
                // expect(order.tokenGet).to.equal(token2.address)
                // expect(order.amountGet).to.equal(tokens(1))
                // expect(order.tokenGive).to.equal(token1.address)
                // expect(order.amountGive).to.equal(tokens(1))
                // expect(order.timestamp).to.be.closeTo(Date.now(), 1000)
            })
            it("should emit an Order event", async () => {
                const event = receipt.events[0]
                expect(event.event).to.equal("Order")
                const args = event.args
                expect(args.id).to.equal(1)
                expect(args.user).to.equal(user1.address)
                expect(args.tokenBuy).to.equal(token2.address)
                expect(args.amountBuy).to.equal(tokens(1))
                expect(args.tokenSell).to.equal(token1.address)
                expect(args.amountSell).to.equal(tokens(1))
                expect(args.timestamp).to.at.least(1)
            })
        })
        describe("Failure", async () => {
            it("Rejects with no balance", async () => {
                await expect(
                    exchange
                        .connect(user1)
                        .makeOrder(token2.address, amount, token1.address, amount)
                ).to.be.reverted
            })
        })
    })
    describe("Order actions", async () => {
        let tx, receipt
        let amount = tokens(1)
        beforeEach(async () => {
            // provide tokens to user1
            tx = await token1.connect(deployer).transfer(user1.address, tokens(100))
            receipt = await tx.wait()

            tx = await token1.connect(user1).approve(exchange.address, amount)
            receipt = await tx.wait()

            // Depositing tokens before making Order
            tx = await exchange.connect(user1).depositToken(token1.address, amount)
            receipt = await tx.wait()

            // provide tokens to user2
            tx = await token2.connect(deployer).transfer(user2.address, tokens(100))
            receipt = await tx.wait()

            // approve user2 tokens
            tx = await token2.connect(user2).approve(exchange.address, tokens(2))
            receipt = await tx.wait()

            // Depositing tokens before making Order
            tx = await exchange.connect(user2).depositToken(token2.address, tokens(2))
            receipt = await tx.wait()

            tx = await exchange
                .connect(user1)
                .makeOrder(token2.address, amount, token1.address, amount)
            receipt = await tx.wait()

            // console.log(`user1 address: ${user1.address}`)
            // console.log(`user2 address: ${user2.address}`)
            // console.log(`exchange address: ${exchange.address}`)
        })
        describe("Cancelling the Orders", async () => {
            describe("Success", async () => {
                beforeEach(async () => {
                    tx = await exchange.connect(user1).cancelOrder(1)
                    receipt = await tx.wait()
                })
                it("should update cancelled orders", async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    expect(orderCancelled).to.equal(true)
                })
                it("should emit a Cancel event", async () => {
                    const event = receipt.events[0]
                    expect(event.event).to.equal("Cancel")
                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenBuy).to.equal(token2.address)
                    expect(args.amountBuy).to.equal(tokens(1))
                    expect(args.tokenSell).to.equal(token1.address)
                    expect(args.amountSell).to.equal(tokens(1))
                    expect(args.timestamp).to.at.least(1)
                })
            })
            describe("Failure", async () => {
                beforeEach(async () => {
                    // Depositing tokens before making Order
                    tx = await token1.connect(user1).approve(exchange.address, amount)
                    receipt = await tx.wait()
                    tx = await token1.connect(deployer).transfer(user1.address, tokens(10))
                    receipt = await tx.wait()

                    tx = await exchange.connect(user1).depositToken(token1.address, amount)
                    receipt = await tx.wait()

                    tx = await exchange
                        .connect(user1)
                        .makeOrder(token2.address, amount, token1.address, amount)
                    receipt = await tx.wait()
                })
                it("Rejects invalid order ids", async () => {
                    await expect(exchange.connect(user1).cancelOrder(999)).to.be.reverted
                })
                it("Rejects unauthorized cancelations", async () => {
                    await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                })
            })
        })
        describe("Filling the orders", async () => {
            describe("Success", async () => {
                beforeEach(async () => {
                    // user2 will be filling th order
                    tx = await exchange.connect(user2).fillOrder("1")
                    receipt = await tx.wait()
                })
                it("executes the trade and charge the fees", async () => {
                    // Verify that trade occurs

                    // Token Sell
                    expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(
                        tokens(0)
                    )
                    expect(await exchange.balanceOf(token1.address, user2.address)).to.equal(
                        tokens(1)
                    )
                    expect(await exchange.balanceOf(token1.address, feeAccount.address)).to.equal(
                        tokens(0)
                    )

                    // Token Buy
                    expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(
                        tokens(1)
                    )
                    expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(
                        tokens(0.9)
                    )
                    expect(await exchange.balanceOf(token2.address, feeAccount.address)).to.equal(
                        tokens(0.1)
                    )
                })
                it("emits a Trade event", async () => {
                    const event = receipt.events[0]
                    expect(event.event).to.equal("Trade")
                    const args = event.args
                    expect(args.id).to.equal(1)
                    expect(args.user).to.equal(user1.address)
                    expect(args.tokenBuy).to.equal(token2.address)
                    expect(args.amountBuy).to.equal(tokens(1))
                    expect(args.tokenSell).to.equal(token1.address)
                    expect(args.amountSell).to.equal(tokens(1))
                    expect(args.creator).to.equal(user2.address)
                    expect(args.timestamp).to.at.least(1)
                })
                it("updates filled orders", async () => {
                    expect(await exchange.orderFilled(1)).to.equal(true)
                })
            })
            describe("Failure", async () => {
                it("rejects invalid order ids", async () => {
                    await expect(exchange.connect(user2).fillOrder(999)).to.be.reverted
                })
                it("rejects already filled orders", async () => {
                    tx = await exchange.connect(user2).fillOrder(1)
                    await tx.wait()
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
                it("rejects cancelled orders", async () => {
                    await exchange.connect(user1).cancelOrder(1)
                    await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                })
            })
        })
    })
})
