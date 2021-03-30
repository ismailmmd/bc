import * as crypto from "crypto";

class Transaction {

    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ){}

    toString(): string {
        return JSON.stringify(this);
    }
}

class Block {

    constructor(
        public prevHash: any,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    
    public get hash() : string {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
    
}

class Chain {
    public static instance = new Chain();
    chain: Block[];

    // for mining
    public nonce = Math.round(Math.random() * 999999999);

    constructor() {
        this.chain = [new Block(null, new Transaction(100, 'genisis', 'satoshi'))];
    }
    
    public get lastBlock() : Block {
        return this.chain[this.chain.length - 1];
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    }

    // for mining
    mine(nonce: number) {
        let solution = 1;
        console.log('..........mining');

        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }
        
    }
    
}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}


// Example usage

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.sendMoney(50, bob.publicKey);
bob.sendMoney(23, alice.publicKey);
alice.sendMoney(5, bob.publicKey);

console.log(Chain.instance)