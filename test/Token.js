const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Token Exchange Test", () => {
    let token, accounts, deployer, recipient, invalidAmount, exchange
    beforeEach(async () => {
        const Token = await ethers.getContractFactory("Token")
        token = await Token.deploy("Token Exchange", "TKE", "1000000")
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        recipient = accounts[1]
        exchange = accounts[2]
    })

    describe("Deployment", () => {
        const name = "Token Exchange"
        const symbol = "TKE"
        const decimals = "18"
        const totalSupply = tokens("1000000")

        it("Should return the right name", async () => {
            expect(await token.name()).to.equal(name)
        })
        it("Should return the right symbol", async () => {
            expect(await token.symbol()).to.equal(symbol)
        })
        it("Should return the right decimals", async () => {
            expect(await token.decimals()).to.equal(decimals)
        })
        it("Should return the right total supply", async () => {
            expect(await token.totalSupply()).to.equal(totalSupply)
        })
        it("assigns totalSupply for deployer", async () => {
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe("Sending Token", () => {
        let amount, tx, receipt
        describe("Success", () => {
            beforeEach(async () => {
                amount = tokens("100")
                // await token.transfer(recipient.address, amount)
                tx = await token.connect(deployer).transfer(recipient.address, amount)
                receipt = await tx.wait()
            })
            it("Should send tokens between accounts", async () => {
                expect(await token.balanceOf(deployer.address)).to.equal(tokens("999900"))
                expect(await token.balanceOf(recipient.address)).to.equal(tokens("100"))
            })
            it("Should emit Transfer event", async () => {
                expect(receipt.events[0].event).to.equal("Transfer")
                expect(receipt.events[0].args.from).to.equal(deployer.address)
                expect(receipt.events[0].args.to).to.equal(recipient.address)
                expect(receipt.events[0].args.value).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("Should reject insufficient balance", async () => {
                invalidAmount = tokens("1000001")
                await expect(
                    token.connect(deployer).transfer(recipient.address, invalidAmount)
                ).to.be.revertedWith("Amount must be greater than 0")
            })
            it("Should reject invalid recipient", async () => {
                await expect(
                    token.connect(deployer).transfer(ethers.constants.AddressZero, amount)
                ).to.be.revertedWith("Invalid recipient")
            })
        })
    })

    describe("Approving Tokens", () => {
        let amount, tx, receipt
        beforeEach(async () => {
            amount = tokens("100")
            tx = await token.connect(deployer).approve(exchange.address, amount)
            receipt = await tx.wait()
        })
        describe("Success", () => {
            it("allocates allowance for delegated token spending", async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)
            })
            it("Should emit Approval event", async () => {
                expect(receipt.events[0].event).to.equal("Approval")
                expect(receipt.events[0].args.owner).to.equal(deployer.address)
                expect(receipt.events[0].args.spender).to.equal(exchange.address)
                expect(receipt.events[0].args.value).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("Should reject invalid spender", async () => {
                await expect(
                    token.connect(deployer).approve(ethers.constants.AddressZero, amount)
                ).to.be.revertedWith("Invalid spender")
            })
        })
    })

    describe("Delegated Token Transfer", () => {
        describe("Success", () => {
            let amount, tx, receipt
            beforeEach(async () => {
                amount = tokens("100")
                await token.connect(deployer).approve(exchange.address, amount)
                tx = await token
                    .connect(exchange)
                    .transferFrom(deployer.address, recipient.address, amount)
                receipt = await tx.wait()
            })
            it("Should transfer tokens between accounts", async () => {
                expect(await token.balanceOf(deployer.address)).to.equal(tokens("999900"))
                expect(await token.balanceOf(recipient.address)).to.equal(tokens("100"))
            })
            it("Should reset allowance", async () => {
                expect(await token.allowance(deployer.address, exchange.address)).to.equal("0")
            })
            it("Should emit Transfer event", async () => {
                expect(receipt.events[0].event).to.equal("Transfer")
                expect(receipt.events[0].args.from).to.equal(deployer.address)
                expect(receipt.events[0].args.to).to.equal(recipient.address)
                expect(receipt.events[0].args.value).to.equal(amount)
            })
        })
        describe("Failure", () => {
            it("Should reject insufficient balance", async () => {
                invalidAmount = tokens("1000001")
                await token.connect(deployer).approve(exchange.address, invalidAmount)
                await expect(
                    token
                        .connect(exchange)
                        .transferFrom(deployer.address, recipient.address, invalidAmount)
                ).to.be.revertedWith("Amount must be greater than 0")
            })
        })
    })
})
