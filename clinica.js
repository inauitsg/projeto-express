const express = require('express')
const app = express()

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
var pg = require('pg')
var consString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString: consString, ssl: { rejectUnauthorized: false } })

app.get('/', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        res.status(200).send('conectado com sucesso')
    })
})

/**...........CADASTRO DE LOGIN.............. */

/** criar tabela de usuarios pelo postman*/

app.get('/criartabelausuario', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        var sql = 'create table usuarios (email varchar(50), senha varchar(200), perfil varchar(15))'
        client.query(sql, (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

/** cadastrar novo usuario */

app.post('/usuario', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('select * from usuarios where email = $1', [req.body.email], (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }

            if (result.rowCount > 0) {
                return res.status(200).send('Registro já existe')
            }
            bcrypt.hash(req.body.senha, 10, (error, hash) => {
                if (error) {
                    return res.status(500).send({
                        message: 'Erro de autenticação',
                        erro: error.message
                    })
                }
                var sql = 'insert into usuarios(email, senha, perfil) values ($1,$2,$3)'
                client.query(sql, [req.body.email, hash, req.body.perfil], (error, result) => {
                    if (error) {
                        return res.status(403).send('Operação não permitida')
                    }
                    res.status(201).send({
                        mensagem: 'criado com sucesso',
                        status: 201
                    })
                })
            })
        })
    })
})

/** exibir usuarios */
app.get('/usuario', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from usuarios', (error, result) => {
            if (error) {
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})

/** login de usuario */
app.post('/usuario/login', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from usuarios where email = $1', [req.body.email], (error, result) => {
            if (error) {
                return res.status(401).send('operação não permitida')
            }
            if (result.rowCount > 0) {
                //cripotgrafar a senha enviada e comparar com a recuperada do banco
                bcrypt.compare(req.body.senha, result.rows[0].senha, (error, results) => {
                    if (error) {
                        return res.status(401).send({
                            message: "Falha na autenticação"
                        })
                    }
                    if (results) { //geração do token
                        let token = jwt.sign({
                                email: result.rows[0].email,
                                perfil: result.rows[0].perfil
                            },
                            process.env.JWTKEY, { expiresIn: '1h' })
                        return res.status(200).send({
                            message: 'Conectado com sucesso',
                            token: token
                        })
                    }
                })
            } else {
                return res.status(200).send({
                    message: 'usuário não encontrado'
                })
            }
        })
    })
})

/**deletar usuario cadastrado */

app.delete('/usuario/:email', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send('Conexão não autorizada')
        }
        client.query('delete from usuarios where email = $1', [req.params.email], (error, result) => {
            if (error) {
                return res.status(401).send('operação não autorizada')
            }
            res.status(200).send({ message: 'registro excluido com sucesso' })
        })
    })
})

/**alterar usuario cadastrado */

app.put('/usuario/:email', (req, res) => {
    pool.connect((err, client) => {
        if (err) {
            return res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from usuarios where email = $1', [req.params.email], (error, result) => {
            if (error) {
                return res.status(401).send("Operação não permitida")
            }
            
            if (result.rowCount > 0) {
                var sql = 'update usuarios set senha=$1, perfil=$2 where email=$3'
                let valores = [req.body.senha, req.body.perfil, req.params.email]
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


/**...........CADASTRO DE MÉDICOS.............. */

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

/**...........ESPECIALIDADES.............. */

/** criar tabela para não precisar do pgAdmin se necessário */
app.get('/criarespecialidades', (req,res) => {
    pool.connect((err, client) => {
        if(err){
            return res.status(401).send('Conexão não autorizada')
        }
        var sql = 'create table especialidades (id serial primary key, especialidade varchar(30))'
        client.query( sql,
        (error, result) => {
            if(error){
                return res.status(401).send('Operação não autorizada')
            }
            res.status(200).send(result.rows)

        })
        
    })
    
})
/** postar especialidades */
app.post('/especialidades',(req,res) => {
    pool.connect((err,client) => {
        if(err){
            return res.status(401).send('conexão nao autorizada')
        }
        client.query('select * from especialidades where id= $1', [req.body.id],(error, result) =>{
            if (error){
                return res.status(401).send('operação não autorizada')
            }
            if(result.rowCount > 0){
                return res.status(200).send('registro já existe')
            }
            
        var sql = 'insert into especialidades(especialidade) values($1)'
        client.query(sql,[req.body.especialidade],(error,result) => {
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
app.get('/especialidades', (req,res) => {
    pool.connect((err,client)=>{
        if(err){
            res.status(401).send("Conexão não autorizada")
        }
        client.query('select * from especialidades', (error, result) =>{
            if(error){
              return  res.status(401).send('operação não autorizada')
            }
            res.status(200).send(result.rows)
        })
    })
})


app.listen(process.env.PORT || 8081, () => console.log(`http://localhost:8081`))