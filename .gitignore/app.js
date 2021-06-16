require('dotenv').config()

// console.log(process.env.PRISMIC_ENDPOINT, process.env.PRISMIC_CLIENT_ID)

const express = require('express')
const errorHandler = require('errorhandler')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const logger = require('morgan')

const app = express()
const path = require('path')
const port = 3000

const Prismic = require('@prismicio/client');
const PrismicDOM = require('prismic-dom');
const { defaultMaxListeners } = require('events')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false}))
app.use(methodOverride())
app.use(errorHandler())

// Link Resolver
const handleLinkResolver = doc => {

  // Define the url depending on the document type
  if (doc.type === 'product') {
    return '/details/' + doc.uid;
  } else if (doc.type === 'about') {
    return '/about';
  }
//   // Default to homepage
  return '/';
}

// Initialize the prismic.io api
const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRIMSIC_ACCESS_TOKEN,
    req: req
  });
}

// Middleware to inject prismic context
app.use((req, res, next) => {
  // res.locals.ctx = {
  //   endpoint: process.env.PRISMIC_ENDPOINT,
  //   linkResolver: handleLinkResolver,
  // };
  
  // add PrismicDOM in locals to access them in templates.
  res.locals.Link = handleLinkResolver;
  res.locals.PrismicDOM = PrismicDOM;
  res.locals.Numbers = index => {
    return index == 0 ? 'One' : index == 1 ? 'Two' : index == 2 ? 'Three' : index == 3 ? 'Four' : index == 5 ? 'Five' : '';
  }

  next();
});

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

const handleRequest = async api => {
  const meta = await api.getSingle('meta')
  const navigation = await api.getSingle('navigation')
  const preloader = await api.getSingle('preloader')

  return {
    meta,
    navigation,
    preloader
  }
}

app.get('/', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const home = await api.getSingle('home')
  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  res.render('pages/home', {
    ...defaults,
    collections,
    home
  })
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const about = await api.getSingle('about')

  res.render('pages/about', {
    ...defaults,
    about
  })
})

app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title'
  })
  res.render('pages/detail', {
    ...defaults,
    product
  })
}) 

app.get('/collections', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const home = await api.getSingle('home')
  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  res.render('pages/collections', {
    ...defaults,
    collections,
    home
  })
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})