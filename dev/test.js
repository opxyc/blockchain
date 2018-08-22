const Blockchain=require('./Blockchain');

const test=new Blockchain();
/*
test.createNewBlock(100,'asd','asd');
const previousHash='asdaASDDA890ADASDASD';
const currentData=[
    {
        amount:100,
        sender:'me',
        recipient:'you'
    },
    {
        amount:30,
        sender:'you',
        recipient:'me'
    }
];
a=test.proofOfWork(previousHash,currentData,2);
b=test.hashBlock(previousHash,currentData,a);
console.log(b);
*/

const bc1={
    "chain": [
    {
    "index": 1,
    "timestamp": 1534373244353,
    "transactions": [],
    "nonce": 0,
    "hash": "0",
    "previousBlockHash": "0"
    },
    {
    "index": 2,
    "timestamp": 1534373257491,
    "transactions": [],
    "nonce": 363,
    "hash": "005c850455f8bf8801a8901d9908cb6acd33bc49c9d718fcf30867c3cbc91ee3",
    "previousBlockHash": "0"
    },
    {
    "index": 3,
    "timestamp": 1534373407888,
    "transactions": [
    {
    "amount": 1,
    "sender": "nowhere",
    "recipient": "2d548310a0dd11e8ae3a21ed363646fd",
    "id": "3530fe60a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 10,
    "sender": "me",
    "recipient": "you",
    "id": "7888fbe0a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 10,
    "sender": "me",
    "recipient": "you",
    "id": "79a89cb0a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 100,
    "sender": "ghost",
    "recipient": "me",
    "id": "84c2b6d0a0dd11e8ae3a21ed363646fd"
    }
    ],
    "nonce": 494,
    "hash": "00504f63e073fbc2fe6cbc9db77f4a955a217e42dd3f07172ec62a2c607919a0",
    "previousBlockHash": "005c850455f8bf8801a8901d9908cb6acd33bc49c9d718fcf30867c3cbc91ee3"
    },
    {
    "index": 4,
    "timestamp": 1534373445193,
    "transactions": [
    {
    "amount": 1,
    "sender": "nowhere",
    "recipient": "2d548310a0dd11e8ae3a21ed363646fd",
    "id": "8ece9540a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 40,
    "sender": "ghost",
    "recipient": "me",
    "id": "9b9770d0a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 50,
    "sender": "ghost",
    "recipient": "me",
    "id": "9dbcc1d0a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 60,
    "sender": "ghost",
    "recipient": "me",
    "id": "a04408f0a0dd11e8ae3a21ed363646fd"
    },
    {
    "amount": 70,
    "sender": "ghost",
    "recipient": "me",
    "id": "a3292780a0dd11e8ae3a21ed363646fd"
    }
    ],
    "nonce": 319,
    "hash": "00594167f19153f72e73a1ee4659a7b76f3454e25f36ef612d411552c7d61bb2",
    "previousBlockHash": "00504f63e073fbc2fe6cbc9db77f4a955a217e42dd3f07172ec62a2c607919a0"
    },
    {
    "index": 5,
    "timestamp": 1534373463786,
    "transactions": [
    {
    "amount": 1,
    "sender": "nowhere",
    "recipient": "2d548310a0dd11e8ae3a21ed363646fd",
    "id": "a50ab8c0a0dd11e8ae3a21ed363646fd"
    }
    ],
    "nonce": 162,
    "hash": "00d4228c75dcb1cff3dc8697cb58c412b88bd55797cc02983311f700342a6d41",
    "previousBlockHash": "0094167f19153f72e73a1ee4659a7b76f3454e25f36ef612d411552c7d61bb2"
    },
    {
    "index": 6,
    "timestamp": 1534373466114,
    "transactions": [
    {
    "amount": 1,
    "sender": "nowhere",
    "recipient": "2d548310a0dd11e8ae3a21ed363646fd",
    "id": "b01fc9d0a0dd11e8ae3a21ed363646fd"
    }
    ],
    "nonce": 106,
    "hash": "0001e90ac8c5ee1d0bf7081cf157ea679766d3d1f70e5abc2d13903e7343b28f",
    "previousBlockHash": "00d4228c75dcb1cff3dc8697cb58c412b88bd55797cc02983311f700342a6d41"
    }
    ],
    "pendingTransactions": [
    {
    "amount": 1,
    "sender": "nowhere",
    "recipient": "2d548310a0dd11e8ae3a21ed363646fd",
    "id": "b1832a60a0dd11e8ae3a21ed363646fd"
    }
    ],
    "difficulty": 2,
    "myurl": "http://localhost:1001",
    "allNodes": []
};

console.log(test.chainIsValid(bc1.chain));