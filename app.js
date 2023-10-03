const express = require('express')
const moviesJSON = require('./movies.json')
const crypto = require('node:crypto')
const { validateMovie, validatePartialMovie } = require('./schema/movies')


const app = express()
app.disable('x-powered-by')
app.use(express.json())

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'http://movies.com'
]

app.get('/movies', (req, res) => {
    const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)        
    }

    const {genre} = req.query
    if(genre) {
        const filteredMovies = moviesJSON.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(moviesJSON)
})

app.get('/movies/:id', (req, res) =>{
    const {id} = req.params
    const movie = moviesJSON.find(movie => movie.id === id)
    if  (movie) return res.json(movie)

    res.status(404).json({message: 'Movie not found'})
})

app.post('/movies', (req, res) =>{

    const result = validateMovie(req.body)

    if(result.error){
        return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    //esto no seria REST, porque estamos guando
    //el estado de la aplicacion en memoria
    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
        //rate: rate ?? 0, //es obcional por ello se le pone cero por si no esta 

    }
    moviesJSON.push(newMovie)

    res.status(201).json(newMovie) //actualizar la cache
})

app.patch('/movies/:id', (req, res) =>{
    const result = validatePartialMovie(req.body)

    if(!result.success) {
        return res.status(404).json({error: JSON.parse(result.error.message)})
    }

    const {id} = req.params
    const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

    if(movieIndex === -1){
        return res.status(404).json({message: 'Movie not found'})
    }
    
    const updateMovie = {
        ...moviesJSON[movieIndex],
        ...result.data
    }

    moviesJSON[movieIndex] = updateMovie

    return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) =>{
    const origin =  req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || origin){
        res.header('Access-Control-Allow-Origin', origin)
    }

    const {id} = req.params
    const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

    if(movieIndex === -1){
        return res.status(404).json({message: 'Movie not found'})
    }

    moviesJSON.splice(movieIndex, 1)

    return res.json({message: 'Movie delete'})
})

app.options('/movies/:id', (req, res) => {
    const origin = req.header('origin')
    
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)  
        res.header('Access-Control-Allow-Methods',  'GET, POST, PATCH, DELETE')      
    }
    res.send(200)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT,  ()=>{
    console.log(`server on port: http://localhost:${PORT}`)
})