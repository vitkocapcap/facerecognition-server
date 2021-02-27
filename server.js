import express, { response } from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : 'chjmt0vajdaj',
        database : 'smartbrain'
    }
});

const app = express();



app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.send("Successfully");
})

app.post('/signin', (req,res)=>{
    db.select('email','hash').from('login')
        .where('email', '=', req.body.email)
        .then(data=>{
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if(isValid){
                return db.select('*')
                    .from('users')
                    .where('email', '=', req.body.email)
                    .then(user=>{
                        res.json(user[0]);
                    })
                    .catch(err => res.status(400).json('Unable to get the user.'))
            }else{
                res.status(400).json('Wrong email or password, please try again');
            }
        })
        .catch(err => res.status(400).json('Wrong email or password, please try again'))
})

app.post('/register', (req,res)=>{
    const {email, name, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date()
                })
                .then(user=>{
                    res.json(user[0]);
                })
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err=>res.status(400).json('Unable to register'));
})

app.get('/profile/:id', (req,res)=>{
    const {id} = req.params;
    db
    .select('*')
    .from('users')
    .where({id})
    .then(user=>{
        if(user.length){
            res.json(user[0]);   
        }else{
            res.status(400).json('Unable to register');
        }
    })
    .catch(err=>res.status(400).json('An error has occurred'));
})

app.put('/image', (req,res)=>{
    const {id} = req.params;
    db('users')
    .where('id', '=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0]);
    })
    .catch(err=>res.status(400).json('Unable to count.'));
})

app.listen(3000, ()=>{
    console.log('running');
})



/**
 * --> res = this is working
 *
 * /sigin --> POST (success/fail) 
 * /register --> POST (user)
 * /profile/:userID --> GET = user
 * /image --> PUT --> user
 * 
 */