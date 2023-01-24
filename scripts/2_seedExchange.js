const config = require("../src/config.json")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

const wait = (seconds) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

async function main() {
    // Fetch the accounts
    const accounts = await ethers.getSigners()

    // Fetch the network ID
    const { chainId } = await ethers.provider.getNetwork()
    console.log(`chainID: ${chainId}`)

    const apT = await ethers.getContractAt("Token", config[chainId].apT.address)
    console.log(`apT fetched: ${apT.address}`)

    const fDAI = await ethers.getContractAt("Token", config[chainId].fDAI.address)
    console.log(`fDAI fetched: ${fDAI.address}`)

    const fETH = await ethers.getContractAt("Token", config[chainId].fETH.address)
    console.log(`fETH fetched: ${fETH.address}`)

    const exchange = await ethers.getContractAt("Exchange", config[chainId].exchange.address)
    console.log(`Exchange fetched: ${exchange.address}`)

    // setup users
    const user1 = accounts[0]
    const user2 = accounts[1]
    let amount = tokens(10000)

    // user1 transfers 10000 fETH to user2
    let tx = await fETH.connect(user1).transfer(user2.address, amount)
    await tx.wait()
    console.log(`Transferred ${amount} fETH from user1:${user1.address} to user2:${user2.address}`)

    // Depositing apT tokens to the exchange on behalf of user1
    // user1 approves 10000 APT
    tx = await apT.connect(user1).approve(exchange.address, amount)
    await tx.wait()
    console.log(`Approved ${amount} apT from user1:${user1.address}`)

    // user1 deposits 10000 APT
    tx = await exchange.connect(user1).depositToken(apT.address, amount)
    await tx.wait()
    console.log(`Deposited ${amount} apT from user1:${user1.address}`)

    // Depositing fETH tokens to the exchange on behalf of user2
    // user2 approves 10000 fETH
    tx = await fETH.connect(user2).approve(exchange.address, amount)
    await tx.wait()
    console.log(`Approved ${amount} fETH from user2:${user2.address}`)

    // user2 deposits 10000 fETH
    tx = await exchange.connect(user2).depositToken(fETH.address, amount)
    await tx.wait()
    console.log(`Deposited ${amount} fETH from user2:${user2.address}`)

    // Seed cancelled order
    // user1 makes order to get tokens
    let orderId, receipt
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(100), apT.address, tokens(5))
    receipt = await tx.wait()
    console.log(`Made an order from user1:${user1.address}`)

    // user1 cancels order
    orderId = receipt.events[0].args.id
    tx = await exchange.connect(user1).cancelOrder(orderId)
    await tx.wait()
    console.log(`Cancelled order ${orderId} from user1:${user1.address}`)

    await wait(1)
    // Seed filled orders

    // user1 makes order to get tokens
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(100), apT.address, tokens(10))
    receipt = await tx.wait()
    console.log(`Made an order from user1:${user1.address}`)

    // user2 fills order
    orderId = receipt.events[0].args.id
    tx = await exchange.connect(user2).fillOrder(orderId)
    await tx.wait()
    console.log(`Filled order ${orderId} from user2:${user2.address}`)

    // wait for 1 second
    await wait(1)

    // user1 will make another order
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(50), apT.address, tokens(15))
    receipt = await tx.wait()
    console.log(`Made an order from user1:${user1.address}`)

    // user2 will fill another order
    orderId = receipt.events[0].args.id
    tx = await exchange.connect(user2).fillOrder(orderId)
    await tx.wait()
    console.log(`Filled order ${orderId} from user2:${user2.address}`)

    // wait for 1 second
    await wait(1)

    // user1 will make last order
    tx = await exchange.connect(user1).makeOrder(fETH.address, tokens(200), apT.address, tokens(20))
    receipt = await tx.wait()
    console.log(`Made an order from user1:${user1.address}`)

    // user2 will fill last order
    orderId = receipt.events[0].args.id
    tx = await exchange.connect(user2).fillOrder(orderId)
    await tx.wait()
    console.log(`Filled order ${orderId} from user2:${user2.address}`)

    // wait for 1 second
    await wait(1)

    // Seed the open orders
    // user1 will make multiple orders with for loop
    for (let i = 0; i <= 5; i++) {
        tx = await exchange
            .connect(user1)
            .makeOrder(fETH.address, tokens(10 * i), apT.address, tokens(10))
        receipt = await tx.wait()
        console.log(`Made an order from user1:${user1.address}`)

        // wait for 1 second
        await wait(1)
    }

    // user2 will make multiple orders with for loop
    for (let i = 0; i <= 5; i++) {
        tx = await exchange
            .connect(user2)
            .makeOrder(apT.address, tokens(10), apT.address, tokens(10 * i))
        receipt = await tx.wait()
        console.log(`Made an order from user2:${user2.address}`)

        // wait for 1 second
        await wait(1)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
