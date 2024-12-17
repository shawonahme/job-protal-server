require('dotenv').config()
const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieparser = require('cookie-parser')
const app = express()
const port = process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//midware use
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(express.json())
app.use(cookieparser())

// verifly token cusstom 
const veryflytoken = (req,res,next)=>{
  const token = req.cookies?.token;
  console.log('here is tokerkn',token)
  if(!token){
    return res.status(401).send({message:'unauthorize access'})
  }

  // verify token
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decode)=>{
    if(err){
      return res.status(401).send({message:'unauthorize access'})
    
    }
    next()
   
  })
  
}


const uri = "mongodb+srv://jobProtal:NTCV8eSVPzIsJjel@cluster0.u5q3a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    //job api 

    const jobsCollections = client.db('jobProtal').collection('jobs')
    const applicationCollections = client.db('jobProtal').collection('application')



// jwt relative api start here

app.post('/jwt',async (req,res)=>{
   const user = req.body;
   const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'5h'})
   res.cookie('token', token,{
    httpOnly:true,
    secure:false
   })
   .send({success:true})
})

//logout clear cookie
app.post('/logout', (req,res)=>{
  res.clearCookie('token',
    {
      httpOnly:true,
      secure: false
    }
  )
  .send({success:true})
})
// jwt relative api end  here 











    // get job api

    app.get('/jobs', async (req, res) => {
      const cursor = jobsCollections.find().limit(6);
      const result = await cursor.toArray();
      res.send(result);

    })
    app.get('/allJobs', async (req, res) => {
      const cursor = jobsCollections.find();
      const result = await cursor.toArray();
      res.send(result);

    })
    // see job details api
    app.get('/jobs/:id', async (req, res) => {

      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollections.findOne(query);
      res.send(result)
    })

    // add job api

    app.post('/addjob', async (req, res) => {

      const addJob = req.body;
      const result = await jobsCollections.insertOne(addJob);
      res.send(result)
    })
    //my post  job api


    app.get('/myPostsJob',veryflytoken, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
          query = { hr_email: email }
          
      }
      const cursor = jobsCollections.find(query);
          const result = await cursor.toArray();
          res.send(result);
     
  });

  //check duplicate data in apply section
 
  app.post('/apply', async (req, res) => {
    const data = req.body; // ক্লায়েন্ট থেকে আসা পুরো ডেটা
  
    try {
      // ডুপ্লিকেট চেক
      const existingData = await applicationCollections.findOne({ job_id: data.job_id});
      if (existingData) {
        return res.status(400).json({ message: "already apply in this job please try new one" }); 
      }
  
      // ডেটা Target Collection-এ যোগ করুন
      await applicationCollections.insertOne(data);
     res.status(200).json({ message: "data added successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Server Error!" });
    }
  });
  

//  // my applicant post
//  app.post('/apply', async (req, res) => {
  
 
//   const apply = req.body

 
//  const find = await applicationCollections.findOne({_id: apply.job_id})
//  if(find){
//   return res.status(400).json({ message: "এই ডেটা ইতিমধ্যে যোগ করা হয়েছে!" });
//  }
//   else{
    
//   const result = await applicationCollections.insertOne(apply);
//   res.send(result)
//   }
// })


//my applicant get

app.get('/my-application',veryflytoken, async(req,res)=>{
  
  const email = req.query.email;
// console.log(req.cookies.token);
  let query = {};
  if(email){
    query = { applicant_email: email }
  }
  
  const result = await applicationCollections.find(query).toArray();
  res.send(result)

})

//my application delete

app.delete('/myApppDel/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await applicationCollections.deleteOne(query)
  res.send(result)
})

  } finally {


  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

//
//