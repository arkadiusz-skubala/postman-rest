// server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('./api/db.json');
const middlewares = jsonServer.defaults();

router.render = (req, res) => {
    let data = res.locals.data;
    if (req.method === 'GET' && req.url.indexOf("/books") === 0) {
        if(Array.isArray(data)) {
            data = data.map(book => ({...book, average_rate: getAverageRate(book.id)}));
        }
        else {
            data.average_rate = getAverageRate(data.id);
        }
    }
    res.jsonp(data);
}

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser)
server.use((req, res, next) => {
    if (req.method === 'PATCH') {
        res.status(405).jsonp({
            error: "Method not allowed"
        });
    }
    if (req.method === 'POST' && req.url.indexOf("/books") === 0){
        if(!req.body.author_id){
            res.status(422).jsonp({
                error: "Missing required field - author_id"
            });
        }
        if(!req.body.title){
            res.status(422).jsonp({
                error: "Missing required field - title"
            });
        }
        const currDate = getCurrentDate();
        const author = getAuthor(req.body.author_id);
        if (author) {
            req.body.inserted = currDate;
            req.body.modified = currDate;
        }
        else {
            res.status(403).jsonp({
                error: "Invalid author_id"
            })
        }
    }

    if (req.method === 'POST' && req.url.indexOf("/authors") === 0){
        if(!req.body.name){
            res.status(422).jsonp({
                error: "Missing required field - name"
            });
        }
        const currDate = getCurrentDate();
        req.body.inserted = currDate;
        req.body.modified = currDate;
    }

    if (req.method === 'POST' && req.url.indexOf("/rates") === 0){
        if(!req.body.book_id){
            res.status(422).jsonp({
                error: "Missing required field - book_id"
            });
        }
        if(!req.body.rate){
            res.status(422).jsonp({
                error: "Missing required field - rate"
            });
        }
        else {
            const book = getBook(req.body.book_id);
            if (book) {
                if(req.body.rate < 0 || req.body.rate > 5) {
                    res.status(403).jsonp({
                        error: "Invalid rate. Value must be between 0 and 5"
                    })
                }
            }
            else {
                res.status(403).jsonp({
                    error: "Invalid book_id"
                })
            }
        }
    }

    if (req.method === 'PUT' && req.url.indexOf("/books") === 0){
        if (req.body.id) {
            res.status(403).jsonp({
                error: "Updating the id of the resource is forbidden"
            })
        }
        else {
            if(!req.body.author_id){
                res.status(422).jsonp({
                    error: "Missing required field - author_id"
                });
            }
            if(!req.body.title){
                res.status(422).jsonp({
                    error: "Missing required field - title"
                });
            }
            const currDate = getCurrentDate();
            const author = getAuthor(req.body.author_id);
            if (author) {
                req.body.modified = currDate;
            }
            else {
                res.status(403).jsonp({
                    error: "Invalid author_id"
                })
            }
        }
    }

    if (req.method === 'PUT' && req.url.indexOf("/authors") === 0){
        if (req.body.id) {
            res.status(403).jsonp({
                error: "Updating the id of the resource is forbidden"
            })
        }
        else {
            if(!req.body.name){
                res.status(422).jsonp({
                    error: "Missing required field - name"
                });
            }
            req.body.modified = getCurrentDate();
        }
    }

    if (req.method === 'PUT' && req.url.indexOf("/rates") === 0){
        if (req.body.id) {
            res.status(403).jsonp({
                error: "Updating the id of the resource is forbidden"
            })
        }
        else {
            if(!req.body.book_id){
                res.status(422).jsonp({
                    error: "Missing required field - book_id"
                });
            }
            if(!req.body.rate){
                res.status(422).jsonp({
                    error: "Missing required field - rate"
                });
            }
            const book = getBook(req.body.book_id);
            if (book) {
                if(req.body.rate < 0 || req.body.rate > 5) {
                    res.status(403).jsonp({
                        error: "Invalid rate. Value must be between 0 and 5"
                    })
                }
            }
            else {
                res.status(403).jsonp({
                    error: "Invalid book_id"
                })
            }
        }
    }

    if (req.method === 'DELETE' && req.url.indexOf("/books") === 0){
        if(!isAuthorized(req.headers)){
            res.status(401).jsonp({
                error: "Unauthorized"
            })
        }
        if (!getBook(req.url.split("/")[2])) {
            res.status(404).jsonp({
                error: "Resource not found"
            })
        }
        else {
            // res.status(204).jsonp();
        }
    }

    if (req.method === 'DELETE' && req.url.indexOf("/authors") === 0){
        if(!isAuthorized(req.headers)){
            res.status(401).jsonp({
                error: "Unauthorized"
            })
        }
        if (!getAuthor(req.url.split("/")[2])) {
            res.status(404).jsonp({
                error: "Resource not found"
            })
        }
        else {
           // res.status(204).jsonp();
        }
    }

    if (req.method === 'DELETE' && req.url.indexOf("/rates") === 0){
        if(!isAuthorized(req.headers)){
            res.status(401).jsonp({
                error: "Unauthorized"
            })
        }
        if (!getRate(req.url.split("/")[2])) {
            res.status(404).jsonp({
                error: "Resource not found"
            })
        }
        else {
           // res.status(204).jsonp();
        }
    }
    // Continue to JSON Server router
    next()
})

server.use(middlewares)
server.use(router)
server.listen(3000, () => {
    console.log('JSON Server is running')
})

function isAuthorized(headers){
    return headers.authorization === 'Basic YWRtaW46YWRtaW4=';
}

function getRate(id) {
    return router.db.get("rates").__wrapped__.rates.find(rate => rate.id === Number(id));
}

function getBook(id) {
    return router.db.get("books").__wrapped__.books.find(book => book.id === Number(id));
}

function getAuthor(id) {
    return router.db.get("authors").__wrapped__.authors.find(author => author.id === Number(id));
}

function getAverageRate(id) {
    const rates = router.db.get("rates").__wrapped__.rates.filter(rate => rate.book_id === id);
    const sum = rates.map(rate => rate.rate).reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    return (sum / rates.length) || 0;
}

function getCurrentDate() {
    let date = new Date(Number(Date.now()));

    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).length === 1 ? `0${(date.getMonth() + 1)}` : (date.getMonth() + 1);
    let day = String(date.getDate()).length === 1 ? `0${date.getDate()}` : date.getDate();
    let hours = String(date.getHours()).length === 1 ? `0${date.getHours()}` : date.getHours();
    let minutes = String(date.getMinutes()).length === 1 ? `0${date.getMinutes()}` : date.getMinutes();
    let seconds = String(date.getSeconds()).length === 1 ? `0${date.getSeconds()}` : date.getSeconds();
    return day + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
}
