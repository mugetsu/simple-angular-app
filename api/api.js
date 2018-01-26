// Create API
const restify = require('restify')
const marklogic = require('marklogic')
const corsMiddleware = require('restify-cors-middleware')
const server = restify.createServer()

const cors = corsMiddleware({
    origins: ['http://localhost:4200']
})

server.pre(cors.preflight)
server.use(cors.actual)
server.use(restify.plugins.bodyParser())

const db = marklogic.createDatabaseClient({
    host: '52.211.64.104',
    port: 8000,
    user: 'meetup-user',
    password: 'm33tup'
})

const qb = marklogic.queryBuilder

// Adding endpoints
server.get('/api/characters', (req, res) => {
    db.documents.query(
        qb.where(
            qb.collection('characters')
        ).slice(0, 60)
    ).result()
    .then(documents => res.json(documents))
    .catch(err => console.error(err))
})

server.get('/api/characters/:name', (req, res) => {
    const uri = `/characters/${req.params.name}`
    db.documents.read(uri).result()
    .then(document => res.json(document[0]))
    .catch(err => console.error(err))
})

server.get('/image/:name', (req, res) => {
    // Get image in chunks via stream
    const uri = req.url
    const data = []
    db.documents.read(uri).stream('chunked')
    .on('data', chunk => data.push(chunk))
    .on('error', err => console.error(err))
    .on('end', () => {
        let buffer = new Buffer(data.length).fill(0)
        buffer = Buffer.concat(data)
        res.writeHead(200, { 'Content-type': 'image/png' })
        res.end(buffer)
    })
})

server.post('/api/search/', (req, res) => {
    const term = req.body;
    db.documents.query(
      qb.where(
        qb.collection('characters'),
        qb.parsedFrom(term)
      ).slice(0, 100)
    ).result()
    .then(searchResults => res.json(searchResults))
    .catch(error => console.error(error));
  })

server.listen(3000, () => {
    console.info('Starting...');
})