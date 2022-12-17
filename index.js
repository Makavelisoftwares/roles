const express=require('express');
const app=express();
const helmet=require('helmet');
const morgan=require('morgan');
const bodyParser=require('body-parser');
require('dotenv').config();
const methodOverride=require('method-override');
const {sequelize,users}=require('./models')
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const port=5000;

// connecting mongodb database 
sequelize.authenticate()
    .then(()=>{
        console.log('connected to the roledb database');
        app.listen(port,()=>{
            console.log('listening to requests on port  http://localhost:'+port)
        })
    })
    .catch((err)=>console.log(err))

// setting the view template and enabling the static files
app.set('view engine','ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'));
app.use(morgan('common'));
app.use(helmet());
app.use(methodOverride('_method'));
app.use(cookieParser())


// creating a token function 
const createToken=(id)=>{
    return jwt.sign({id},'secret');
}

// middleware to protect route  
const protectRoute=(req,res,next)=>{
    const token=req.cookies.auth;
    if(token){
        jwt.verify(token,'secret',(err,decodedToken)=>{
            if(err){
                res.redirect('/login')
            }else{
                console.log(decodedToken.id);
                next()
            }
        })
    }else{
        res.redirect('/login')
    }
}

// check if user exists
const checkUser=(req,res,next)=>{
    const token=req.cookies.auth;
    if(token){
        jwt.verify(token,'secret',async(err,decodedToken)=>{
            if(err){
                res.redirect('/login')
                res.locals.user=null;
                next()
            }else{
                const user=await users.findOne({where:{id:decodedToken.id}})
                res.locals.user=user;
                console.log(decodedToken.id);
                next()
            }
        })
    }else{
        res.redirect('/login')
    }
}

// routes
// register route
app.post('/register',async(req,res,next)=>{
    const {username,password,isadmin}=req.body;
    try {
        const hashedPassword=await bcrypt.hash(password,10)
        const user=await users.create({
            password:hashedPassword,
            username,
            isadmin
        })

        if(user){
            const token=createToken(user.id)
            res.cookie('auth',token);
            res.redirect('/');
            next()
        }

        // res.status(200).json(user);
    } catch (error) {
        res.status(400).json(error)
    }
})


// login routes
app.post('/login',async(req,res,next)=>{
    const {username,password}=req.body;
    try {
        const user=await users.findOne({where:{username}})
        if(user){
            const comparePassword=await bcrypt.compare(password,user.password);
            if(comparePassword){
                const token=createToken(user.id);
                res.cookie('auth',token);
                res.redirect('/');
            }

            // res.status(200).json(user)
            next()
        }else{
            res.status(400).json('no such user');
        }
    } catch (error) {
        res.status(400).json(error)
    }
})

app.get('/logout',(req,res)=>{
    res.cookie('auth','',{maxAge:1});
    res.redirect('/login')
})

// homepage
app.get('/',checkUser,protectRoute,(req,res)=>{
    res.render('index')
})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/register',(req,res)=>{
    res.render('register')
})