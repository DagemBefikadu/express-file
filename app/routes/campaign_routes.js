// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for examples
const Campaign = require('../models/campaign')
const Comment = require('../models/comment')
const Contact = require('../models/contact')
const User = require('../models/user')


// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
const campaign = require('../models/campaign')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /examples
router.get('/campaigns',  (req, res, next) => {
	Campaign.find()
		.then((campaigns) => {
			// `examples` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return campaigns.map((campaign) => campaign.toObject())
		})
		// respond with status 200 and JSON of the examples
		.then((campaigns) => res.status(200).json({ campaigns: campaigns }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// SHOW
// GET /examples/5a7db6c74d55bc51bdf39793
router.get('/campaigns/:id', (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Campaign.findById(req.params.id)
	.populate("comment")
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "example" JSON
		.then((campaign) => res.status(200).json({ campaign: campaign.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

router.get('/campaigns/:id/contacts/:contactId', (req,res, next) => {
	Campaign.findById(req.params.id)
	.then(handle404)
	.then((foundCampaign) => {
		// throw an error if current user doesn't own `example`
		foundCampaign.contact.pull(req.params.contactId)
		foundCampaign.save()
		// delete the example ONLY IF the above didn't throw
		Contact.findById(req.params.contactId)
		.populate("campaign")

			// respond with status 200 and JSON of the examples
			.then((contacts) => res.status(200).json({ contacts: contacts }))
			// if an error occurs, pass it to the handler
			.catch(next)
	})
})


// CREATE
// POST /examples
router.post('/campaigns', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.campaign.owner = req.user.id
	const currentUser = req.user

	Campaign.create(req.body.campaign)
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((campaign) => {
			console.log("here is the user", campaign._id)
			currentUser.createdCampaign.push(campaign._id)
			currentUser.save()
			res.status(201).json({ campaign: campaign.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})



//Anyone can post there contact information a campaign 
router.post('/campaigns/:id/contacts',  (req, res, next) => {
	// set owner of new example to be current user

    req.body.contact.campaign = req.params.id

	Contact.create(req.body.contact)
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((contact) => {
			console.log('this is the comment', contact)
			Campaign.findById(req.params.id)
				.then(foundContact => {
					foundContact.contact.push(contact._id)
					foundContact.save()
					res.status(201).json({ contact: contact.toObject() })
				})
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})


// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793
router.patch('/campaigns/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	// delete req.body.campaign.owner

	Campaign.findById(req.params.id)
		.then(handle404)
		.then((campaign) => {
			console.log('this is the campaign', campaign)
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, campaign)

			// pass the result of Mongoose's `.update` to the next `.then`
			return campaign.updateOne(req.body.campaign)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

router.patch('/campaigns/favorites/:id', requireToken, removeBlanks, (req,res,next) => {
	User.findById(req.user.id)
		.then(handle404)
		.then(foundUser => {
			foundUser.favoriteCampaign.pull(req.params.id)
			return foundUser.save()
		})
		.then(() => res.sendStatus(204))
		.catch(next)
})


// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete('/campaigns/:id', requireToken, (req, res, next) => {
	User.findById(req.user.id)
		.then(handle404)
		.then((foundUser) => {
			// throw an error if current user doesn't own `example`
		
			// delete the example ONLY IF the above didn't throw
			foundUser.createdCampaign.pull(req.params.id)
			foundUser.save()
			Campaign.findById(req.params.id)
			.then(handle404)
			.then((campaign) => {
				campaign.deleteOne()
			})
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router
