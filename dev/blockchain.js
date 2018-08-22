const SHA256=require('sha256'); //npm install sha256
const uuid=require('uuid/v1');

class Blockchain{
    constructor(){
        this.chain=[];
        this.pendingTransactions=[];
        this.difficulty=2;
        this.myurl=process.argv[3];
        this.allNodes=[];

        this.createNewBlock(0,'0','0');//create our genesis block
    }

    createNewBlock(nonce,previousBlockHash,hash){
        //create a new block object
        //here is where mining actually take place
        const newBlock={
            index:this.chain.length+1,
            timestamp:Date.now(),
            transactions:this.pendingTransactions, //add all the new transactions here
            nonce:nonce,//a number that comes from the proof of work
            hash:hash,//hash value of all the data part in the block
            previousBlockHash:previousBlockHash, //hash of the data in the previous block
        };

        this.pendingTransactions=[];//clear the values in the pendingTransactions list so that we can start new and clear for next mining
        this.chain.push(newBlock); //add it to the chain

        return newBlock;
    }

    getLastBlock(){
        //returns the last block in the chain
        return this.chain[this.chain.length-1];
    }

    /*
        ***** for synchronization
        we are splitting this method createNewTranscation into two
            one for creating a transaction object
            another for adding to the pendingTransactions list

        This is to make sure that:
            -we can create a transaction object which can be broadcasted over the rest of the nodes in the network
            -other nodes need not create a new transaction object but can simply push it(one which was broadcasted) to the pendingTranscations list directly
    */
    createNewTransaction(amount,sender,recipient){
        //create a transaction object
        const transaction={
            amount:amount,
            sender:sender,
            recipient:recipient,
            id:uuid().split('-').join('')
        };

        return transaction;
        //this.pendingTransactions.push(transaction);
        //return (this.getLastBlock().index)+1;
    }

    addTransaction(transaction){
        //add a transaction to the pendingTransactions list
        this.pendingTransactions.push(transaction);
        //return index value of the block where it is added
        return (this.getLastBlock().index)+1;
    }

    hashBlock(previousBlockHash,currentBlockData,nonce){
        //gives the hash value of the details in a block and returns the hash
        //we will be using SHA256 hash
        const data=previousBlockHash+nonce.toString()+JSON.stringify(currentBlockData);
        const hash=SHA256(data);
        return hash;
    }

    proofOfWork(previousBlockHash,currentBlockData){
        //repeatedly hash the values until it finds a hash with a particular fomat, here, say 00 at the beginning
        //difficulty matters here
        //returns the nonce
        //this nonce is given to hashBlock() function to hash it
        let nonce=0;
        let hash=this.hashBlock(previousBlockHash,currentBlockData,nonce);
        while(hash.substring(0,this.difficulty)!==Array(this.difficulty+1).join("0")){
            nonce+=1;
            hash=this.hashBlock(previousBlockHash,currentBlockData,nonce);
        }

        return nonce;
    }

    chainIsValid(blockchain){
        var valid=true;
        //check if hashes for neighbouring blocks are correct
        //and
        //rehash and check each block
        for(var i=1;i<blockchain.length;i++){
            const currentBlock=blockchain[i];
            const previousBlock=blockchain[i-1];
            const blockHash=this.hashBlock(previousBlock.hash,{transactions:currentBlock.transactions,index:currentBlock.index},currentBlock.nonce);
            if(currentBlock.previousBlockHash!==previousBlock.hash || blockHash.substring(0,this.difficulty)!==Array(this.difficulty+1).join("0")){
                //chain not valid
                valid=false;
            }
        }

        //const genesisBlock=blockchain[0];
        //also check for genesis block values

         return valid;
    }

    getBlock(blockHash){
        let requiredBlock=null;
        this.chain.forEach(block=>{
            if(block.hash===blockHash){
                requiredBlock=block;
            }
        });
        return requiredBlock;
    }

    getTransaction(transactionId){
        let requiredTransaction = null;
        let requiredBlock = null;
    
        this.chain.forEach(block => {
            block.transactions.forEach(transaction=>{
                if(transaction.id===transactionId){
                    requiredTransaction=transaction;
                    requiredBlock=block;
                }
            })
        });
        return {
            transaction: requiredTransaction,
            block: requiredBlock
        };
    };

    getWalletData(address){
        const transactions=[];
        let balance=0;
        this.chain.forEach(block=>{
            block.transactions.forEach(transaction=>{
                if(transaction.sender===address || transaction.recipient===address){
                    transactions.push(transaction);
                    if(transaction.recipient===address){
                        balance+=transaction.amount;
                    }
                    else{
                        balance-=transaction.amount;
                    }
                }
            })
        })

        return{
            transactions:transactions,
            balance:balance
        }
    }
}

module.exports=Blockchain;