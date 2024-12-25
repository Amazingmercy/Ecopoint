require('dotenv').config()
const express = require('express')
const connectDB = require('./CONFIG/dataBase')
const DB_URI = process.env.MONGO_URI
const cookieSession = require('cookie-session');





const cookieParser = require('cookie-parser');
const authenticate = require('./middlewares/auth')
const errorHandler = require('./middlewares/errorHandler')
const app = express()


//Routes
const manufacturerRoute = require('./routes/manufacturerRoute')
const authRoutes = require('./routes/authRoute')
const contributorRoute = require('./routes/contributorRoute')
const collectorRoute = require('./routes/collectorRoute')





//Middlewares
app.set('view engine', 'ejs')
app.set('views', './views');
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));
app.use(cookieSession({
  keys: [process.env.JWT_SECRET_KEY],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


app.use(authRoutes)
app.use('/manufacturer', authenticate, manufacturerRoute)
app.use('/contributor', contributorRoute)
app.use('/collector', authenticate, collectorRoute)
app.use(errorHandler)


const port = 9999 || process.env.PORT
const start = async () => {
    try{
        await connectDB(DB_URI)
        app.listen(port, console.log(`Server is running on port ${port}...`));
    } catch (error){
        console.log(error);
    }
}

start()