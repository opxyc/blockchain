const express=require('express');
const bodyParser = require('body-parser');
const uuid=require('uuid/v1'); //created a unique random string which we will use as id for the node
const rp=require('request-promise'); //this requires request library too
const Blockchain=require('./Blockchain');
const test=new Blockchain();

const nodeid=uuid().split('-').join('');
const app=express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port=process.argv[2];

app.get('/blockchain',function(req,res){
    res.send(test);
});

/*
    another endpoint transaction/broadcast
    Why?
    When ever a new transaction is made at a node, it hits here giving the data,
    where a new transaction is made and added to itself and then the node broadcasts it to all other nodes in the network
    It calls transaction endpoint for this purpose.
*/

app.post('/transaction', function(req, res) {
    const newTransaction=req.body;
    const blockIndex=test.addTransaction(newTransaction);
    res.json({note:"trans will be added to block ${blockIndex}"});
});


app.post('/transaction/broadcast',function(req,res){
    //create a new transaction
    //broadcast it to all other nodes
    const newTransaction=test.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient);
    test.addTransaction(newTransaction);

    const requestPromises=[];
    test.allNodes.forEach(url=>{
        const requestOptions={
            uri:url+'/transaction',
            method:"POST",
            body:newTransaction,
            json:true,
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data=>{
        res.json({Note:"Transaction is broadcasted."});
    });
});

/*
To sync mining information..
1. for mining a new block, hit /mine. 
2. after it is mined, make a hit to a /recieve-new-block to copy the newly mined block to the rest of the nodes in the network
   when other nodes receive this new block, clear all the pendingTransactions it holds
*/

app.get('/mine',function(req,res){
    const lastBlock = test.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: test.pendingTransactions,
		index: lastBlock.index + 1
	};
    const nonce=test.proofOfWork(previousBlockHash,currentBlockData);
    const blockHash=test.hashBlock(previousBlockHash,currentBlockData,nonce)
    const newBlock=test.createNewBlock(nonce,previousBlockHash,blockHash);

    const requestPromises = [];
	test.allNodes.forEach(url => {
		const requestOptions = {
			uri: url + '/receive-new-block',
			method: 'POST',
			body: { newBlock: newBlock },
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

    Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: test.myurl + '/transaction/broadcast',
			method: 'POST',
			body: {
				amount: 1,
				sender: "nowhere",
				recipient: nodeid
			},
			json: true
		};

		return rp(requestOptions);
	})
    .then(data => {
		res.json({
			note: "New block mined & broadcast successfully",
			block: newBlock
		});
	});
});

app.post('/receive-new-block',function(req,res){
    const newBlock=req.body.newBlock;
    //check if the previousHash value provided in the newBlock is equal to that of the hash value of the actual pre block in the chain
    const lastBlock=test.getLastBlock();
    const hashOk=(lastBlock.hash===newBlock.previousBlockHash);
    //check if the previousBlock's index is one less than that of the currentBlock
    const indexOk=lastBlock.index+1 === newBlock.index;
    if(hashOk && indexOk){
        test.chain.push(newBlock);
        test.pendingTransactions=[];
        res.json({
            Note:"New block received and accepted.",
            newBlock:newBlock,
        });
    }
    else{
        res.json({
            Note:"New block mined.",
            newBlock:newBlock,
        });
    }
});

/*
adding a new node to a network
1.
If a new node is added created and we need to add it to the network,
we just hit the register-and-broadcast-node in any of the available nodes in the network.
For this, we need to send the address or url of the new node as data
this  node will register itself with the new node and broadcasts it to the remaining nodes

2.
Then the rest of the nodes currently registered on the network will get the new node's address from register-node

3.
After all the nodes in the network has hitted the register-node end point,
the original node(where register-and-broadcast-node) responds to the new node with the addresses of all the remaining nodes with hit on register-nodes
*/
app.post('/register-and-broadcast-node',function(req,res){
    //register the node and broadcasts it's existance in the network
    const newNodeUrl=req.body.newNodeUrl; //gets the new node's address
    //register it with itself
    if(test.allNodes.indexOf(newNodeUrl)==-1)
        //push only if it does not exist
        test.allNodes.push(newNodeUrl);
    
    const registerNodesPromises=[];
    //now broadcast all the nodes in the network
    test.allNodes.forEach(url => {
        //hit register-node endpoint of all other nodes 
        const requestOptions={
            uri:url+'/register-node',
            method:'POST',
            body:{newNodeUrl:newNodeUrl},
            json:true,
        };

        registerNodesPromises.push(rp(requestOptions));
    });
    //console.log(registerNodesPromises);
    Promise.all(registerNodesPromises)
        .then(date=>{
            //give response to the new node by hitting it's register-nodes end point
            const requestOptions={
                uri:newNodeUrl+'/register-nodes',
                method:"POST",
                body:{allNodes:[...test.allNodes,test.myurl]},
                json:true
            }

            return rp(requestOptions);
        })
        .then(data=>{
            //give  a response to the one called it
            res.json({Node:'New node registered with network.'})
        });
});

app.post('/register-node',function(req,res){
    //register the node with the network and does not broadcast
    //every node receives the address of the new node added to the network
    //just add it to the allNodes list

    const newNodeUrl=req.body.newNodeUrl;
    if(test.allNodes.indexOf(newNodeUrl)==-1 && test.myurl!=newNodeUrl)
        //push only if it does not exist and myurl!=newNodeUrl
        test.allNodes.push(newNodeUrl);
    
    res.json({Node:"New node registered with node."});
});

app.post('/register-nodes',function(req,res){
    //register multiple nodes at once
    //after the new node is registered with the network by the all other nodes,
    // we make the new node to register all the existing nodes with itself
    //so as to get a complete participation
    const allNodes=req.body.allNodes; //get the data send by register-and-broadcast-node

    allNodes.forEach(url=>{
        if(test.allNodes.indexOf(url)==-1 && test.myurl!=url)
            test.allNodes.push(url);
    });
    res.json({Note:"All nodes registered with new node."})
});


app.get('/consensus', function(req, res) {
	const requestPromises = [];
	test.allNodes.forEach(url => {
		const requestOptions = {
			uri: url + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = test.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});


		if (!newLongestChain || (newLongestChain && !test.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: test.chain
			});
		}
		else {
			test.chain = newLongestChain;
			test.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: test.chain
			});
		}
	});
});

app.get('/block/:blockHash',function(req,res){
    //gives a block corresponding to this hash
    //we use a method named getBlock()
    //localhost:1001/block/SOMEHASHVALUE
    const blockHash=req.params.blockHash;
    const block=test.getBlock(blockHash);
    res.json({
        Block:block
    });
});

app.get('/transaction/:transactionId',function(req,res){
    //detail out a transaction
    const transactionId=req.params.transactionId;
    const responseObject=test.getTransaction(transactionId);
    res.json({
        TransactionDetails:responseObject.transaction,
        BlockHoldingTheTransaction:responseObject.block
    });
});

app.get('/address/:address',function(req,res){
    //send an address
    //get all the transactions make to/by this address and current balance
    const address=req.params.address;
    const responseObject=test.getWalletData(address);
    res.json({
        transactionsFromTheAddress:responseObject.transactions,
        walletBalance:responseObject.balance
    })
});

app.set('view engine','ejs');

app.get('/vote',function(req,res){
    //render a template -- we use ejs
    res.render('index');
});

function testIfAlreadyVoted(id){
    var alreadyVoted=false;
    test.chain.forEach(block=>{
        block.transactions.forEach(transaction=>{
            if(transaction.sender===id){
                alreadyVoted=true;
            }
        })
    });
    test.pendingTransactions.forEach(transaction=>{
        if(transaction.sender===id)
            alreadyVoted=true;
    });

    return alreadyVoted;
}

app.post('/get-me-there',function(req,res){
    const id=req.body.cred1;
    const pass=req.body.cred2;
    const response=[];
    if(id==="" || pass===""){
        console.log("Id or password not received!");
        res.render("error");
    }
    else{
        //send the data to an API the election organizer and they returns true 
        //if data is valid
        //then authenticate and show the option for voting with list of candidates
        //send the id to election organizer's api
        const requestPromises = [];
        const requestOptions = {
            uri: 'http://localhost:1004/is-voter-valid',
            method: 'POST',
            body:{id:id,password:pass},
            json: true
        };
        requestPromises.push(rp(requestOptions));
        Promise.all(requestPromises)
        .then(response=> {
            if(!response[0].isVoterValid){
                res.render("error");
            }
            else{
                var alreadyVoted=testIfAlreadyVoted(id);
                const randomIdFromOrganizer=response[0].randomId;
                console.log(randomIdFromOrganizer);//randomId got from organizer's api
                if(alreadyVoted)
                    res.render("already-voted");
                else
                    res.render("do-vote",{id:randomIdFromOrganizer});
            }
        });
    }
});

app.post("/commit",function(req,res){
    const recipient=(req.body.recipient);
    const sender=req.body.sender;
    const alreadyVoted=testIfAlreadyVoted(sender);
    //create a new transaction
    if(alreadyVoted){
        res.render("already-voted");
    }
    else{
        const newTransaction=test.createNewTransaction(1,sender,recipient);
        test.addTransaction(newTransaction);

        const requestPromises=[];
        test.allNodes.forEach(url=>{
            const requestOptions={
                uri:url+'/transaction',
                method:"POST",
                body:newTransaction,
                json:true,
            };

            requestPromises.push(rp(requestOptions));
        });

        Promise.all(requestPromises)
        .then(data=>{
            res.render("you-have-voted");
            console.log("Vote committed and added to list of transactions.");
        });
    }
});

function calculateCandidateVotes(candidates){
    let result={};
    var candidate="";
    test.chain.forEach(block=>{
        block.transactions.forEach(transaction=>{
            candidate=transaction.recipient;
            if(candidates.indexOf(candidate)!==-1){
                if(!result[candidate])
                    result[candidate]=1;
                else
                    result[candidate]=result[candidate]+1;
            }
            else{
                // this recipient is a miner
            }
        });
    });
    console.log(result);
    var res=[];
    for (candidate in result){
        res.push({candidate:candidate,votes:result[candidate]});
    }
    return res;
}

app.get("/count",function(req,res){
    const candidates=['candidate_1','candidate_2']
    const countTime=Date.now()+1000000;
    if(countTime<=Date.now()){
        res.send("Couting not started");
    }
    else{
        //make a request to mine so that all pending transactions will be added to the chain, if pendingTransactions is not []
        var result;
        if(test.pendingTransactions.length!=0){
            const requestPromises = [];
            const requestOptions = {
                uri: 'http://localhost:'+port+'/mine',
                method: 'GET',
                json: true
            };
            requestPromises.push(rp(requestOptions));
            Promise.all(requestPromises)
            .then(response=> {
                //do calculate the result once we get the response
                result=calculateCandidateVotes(candidates);
                res.render("result",{result:result});
            });
        }
        else{
            result=calculateCandidateVotes(candidates);
            res.render("result",{result:result});
        }
        //res.send();
    }
});

app.listen(port,function(){
    console.log(`Listening on port ${port}`);
});