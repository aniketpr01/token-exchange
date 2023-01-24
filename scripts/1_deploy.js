const { ethers } = require("hardhat")

async function main() {
    console.log("Preparing deployment...")

    // Fetch the accounts
    const accounts = await ethers.getSigners()
    const feeAccount = accounts[1]
    console.log(`Accounts fetched:\n${accounts[0].address}\n${feeAccount.address}\n`)

    const Token = await ethers.getContractFactory("Token")
    const Exchange = await ethers.getContractFactory("Exchange")

    const apToken = await Token.deploy("apToken", "APT", "1000000")
    await apToken.deployed()
    console.log(`apToken Deployed to: ${apToken.address}`)

    const fDAI = await Token.deploy("fDAI", "fDAI", "1000000")
    await fDAI.deployed()
    console.log(`fDAI Deployed to: ${fDAI.address}`)

    const fETH = await Token.deploy("fETH", "fETH", "1000000")
    await fETH.deployed()
    console.log(`fETH Deployed to: ${fETH.address}`)

    const exchange = await Exchange.deploy(feeAccount.address, 10)
    await exchange.deployed()
    console.log(`Exchange Deployed to: ${exchange.address}`)

    console.log("Deployment complete!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
