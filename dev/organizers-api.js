const express=require('express');
const bodyParser=require('body-parser');
const rp=require('request-promise');

const app=express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

const port=process.argv[2];
const voters=[
    {
        name:"Name of Voter 1",
        age:23,
        id:"voter1",
        password:"apple",
        randomId:"5d5c8880a2f611e8a5c0e725ebf5d499",
    },
    {
        name:"Name of Voter 2",
        age:50,
        id:"voter2",
        password:"apple",
        randomId:"07b3ead0a2fc11e8908571572c72413d",
    },
    {
        name:"Name of Voter 3",
        age:19,
        id:"voter3",
        password:"apple",
        randomId:"08a15810a2fc11e8908571572c72413d",
    },
]

app.post("/is-voter-valid",function(req,res){
    const id=req.body.id;
    const password=req.body.password;
    let isVoterValid=false;
    let randomId="";
    voters.forEach(voter=>{
        if(voter.id===id && voter.password===password){
            isVoterValid=true;
            randomId=voter.randomId;
        }
    });
    res.json({isVoterValid:isVoterValid,randomId:randomId});
});

app.listen(port,function(){
    console.log(`Organizer's api running on port ${port}`);
});