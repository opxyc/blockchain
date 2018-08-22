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


app.listen(port,function(){
    console.log(`Listening on port ${port}`);
});