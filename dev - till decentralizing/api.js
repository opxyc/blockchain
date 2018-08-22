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

app.post('/transaction', function(req, res) {
    const blockIndex=test.createNewTransaction(req.body.amount,req.body.sender,req.body.recipient);
    res.json({note:"trans will be added to block ${blockIndex}"});
});

app.get('/mine',function(req,res){
    var previousBlockHash=test.getLastBlock().hash;
    //res.send(previousBlockHash);
    
    var previousBlockHash=previousBlockHash.hash;
    const currentBlockData={
        index:test.getLastBlock().index+1,
        transactions:test.pendingTransactions,
    };
    const nonce=test.proofOfWork(previousBlockHash,currentBlockData);
    const blockHash=test.hashBlock(previousBlockHash,currentBlockData,nonce)
    const newBlock=test.createNewBlock(nonce,previousBlockHash,blockHash);
    test.createNewTransaction(1,"nowhere",nodeid);
    //we reward the miner. to get the addredd or id of the node of our bitcoin network who mines a block, we use uuid package
    //the reward will be provided during next mining of next block to come

    res.json({
        note:"New block mined",
        block:newBlock,
    })
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