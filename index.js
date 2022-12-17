const express=require('express');
const app=express();
const mongoose=require('mongoose');
const helmet=require('helmet');
const morgan=require('morgan');
const bodyParser=require('body-parser');
require('dotenv').config();
const methodOverride=require('method-override');
const {sequelize,patients}=require('./models')
const port=5000;

// connecting mongodb database 
sequelize.authenticate()
    .then(()=>{
        console.log('connected to the practise database');
        app.listen(port,()=>{
            console.log('listening to requests on port ' +port)
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
app.use(methodOverride('_method'))


