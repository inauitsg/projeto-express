const express = require('express')
const app = express()

/**Middleware para utilizar urlencoded */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

var pg = require('pg')
var consString = "postgres://nfxjzlhmrvzemb:ff0b86c07b31b3a30dcec54e4727660b23e59902042a837ae602162973971876@ec2-52-5-110-35.compute-1.amazonaws.com:5432/d2pkd46ssesgrc"

const pool = new pg.Pool({connectionString: consString, ssl:{rejectUnauthorized: false}})


app.get('/', (req,res) => {
    pool.connect((err, client) => {
        if(err){
            return res.status(401).send('Conexão não autorizada')
        }
        res.status(200).send('conectado com sucesso')
    })
    
})

/** criar tabela para não precisar do pgAdmin se necessário */
app.get('/criartabelamedicos', (req,res) => {
    pool.connect((err, client) => {
        if(err){
            return res.status(401).send('Conexão não autorizada')
        }
        var sql = 'create table medicos (id serial primary key, especialidade varchar(30), nome varchar(60), crm varchar(6), telefone varchar(11), dias varchar(50))'
        client.query( sql,
        (error, result) => {
            if(error){
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)

        })
        
    })
    
})
/** postar médico */
app.post('/medicos',(req,res) => {
    pool.connect((err,client) => {
        if(err){
            return res.status(401).send('conexão nao autorizada')
        }
        client.query('select * from medicos where crm= $1', [req.body.crm],(error, result) =>{
            if (error){
                return res.status(401).send('operação não autorizada')
            }
            if(result.rowCount > 0){
                return res.status(200).send('registro já existe')
            }
            
        var sql = 'insert into medicos(especialidade, nome, crm, telefone, dias)values($1,$2,$3,$4,$5)'
        client.query(sql,[req.body.especialidade,req.body.nome,req.body.crm,req.body.telefone,req.body.dias],(error,result) => {
            if(error){
                return res.status(403).send('Operação não permitida')
            }
            res.status(201).send({
                mensagem: 'criado com sucesso',
                status: 201
            })
        })
        })
        
    })

} )

 /** mostrar tabela */
app.get('/medicos', (req,res) => {
    pool.connect((err,client)=>{
        if(err){
            res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from medicos', (error, result) =>{
            if(error){
              return  res.status(401).send('operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

 /** DELETE por ID */
app.delete('/medicos/:id', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('delete from medicos where id = $1', [req.params.id], (error, result) => {
            if (error) {
                return res.status(401).send('operação não autorizada')
            }
            res.status(200).send({ message: 'registro excluido com sucesso' })
        })
    })
})

 /** Get por ID */
app.get('/medicos/:id', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('select * from medicos where id = $1', [req.params.id], (error, result) => {
            if (error) {
                return res.status(401).send('operação não autorizada')
            }
            res.status(200).send(result.rows[0])
        })
    })
})

/**alterar cadastro de médico por id */
app.put('/medicos/:id', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from medicos where id = $1', [req.params.id], (error, result) => {
            if (error) {
                return res.status(401).send("Operação não permitida")
            }
            
            if (result.rowCount > 0) {
                var sql = 'update medicos set especialidade=$1, nome=$2, crm=$3, telefone=$4, dias=$5 where id=$6'
                let valores = [req.body.especialidade, req.body.nome, req.body.crm, req.body.telefone, req.body.dias, req.params.id]
                client.query(sql, valores, (error2, result2) => {
                    if (error2) {
                        return res.status(401).send("Operação não permitida")
                    }

                    if (result2.rowCount > 0) {
                        return res.status(200).send('registro alterado com sucesso')
                    }
                })
            } else
                res.status(200).send('usuario não encontrado')
        })
    })
})


app.listen(8081, () => console.log('Aplicação em execução na url http://localhost:8081'))