const { ethers } = require("hardhat")

async function main() {
    const Token = await ethers.getContractFactory("Token")
    const token = await Token.deploy()
    await token.deployed()
    console.log(`Token Deployed to: ${token.address}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
