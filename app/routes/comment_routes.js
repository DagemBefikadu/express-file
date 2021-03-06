// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for examples
const Campaign = require('../models/campaign')
const Comment = require('../models/comment')


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
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()



// SHOW
// GET /examples/5a7db6c74d55bc51bdf39793`

// INDEX
// GET /examples

router.get('/campaigns/:id/comments', (req,res, next) => {
	Comment.find({ 
		campaignId: req.params.id 
	})
	.populate("owner", "name")
		.then((comments) => {
			// `examples` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return comments.map((comment) => comment.toObject())
		})
		// respond with status 200 and JSON of the examples
		.then((comments) => res.status(200).json({ comments: comments }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

router.get('/campaigns/:id/comments/:commentId', (req,res, next) => {
	Campaign.findById(req.params.id)
	.then(handle404)
	.then((foundCampaign) => {
		// throw an error if current user doesn't own `example`
		foundCampaign.comment.pull(req.params.commentId)
		foundCampaign.save()
		// delete the example ONLY IF the above didn't throw
		Comment.findById(req.params.commentId)
		.populate("campaignId", "_id")

			// respond with status 200 and JSON of the examples
			.then((comments) => res.status(200).json({ comments: comments }))
			// if an error occurs, pass it to the handler
			.catch(next)
	})
	
})



// CREATE
// POST /comments
//Each comment will be associated to a Campaign
router.post('/campaigns/:id/comments', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.comment.owner = req.user.id

    req.body.comment.campaign = req.params.id

	Comment.create(req.body.comment)
	// .populate("owner", "name")
		// respond to succesful `create` with status 201 and JSON of new "example"
		.then((comment) => {
			console.log('this is the comment', comment)
			Campaign.findById(req.params.id)
				.then(foundComment => {
					foundComment.comment.push(comment._id)
					foundComment.save()
					res.status(201).json({ comment: comment.toObject() })
				})
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})


// UPDATE
// PATCH /examples/5a7db6c74d55bc51bdf39793

router.patch('/comments/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.comment.owner

	Comment.findById(req.params.id)
		.then(handle404)
		.then((comment) => {
			console.log('this is the campaign', comment)
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, comment)

			// pass the result of Mongoose's `.update` to the next `.then`
			return comment.updateOne(req.body.comment)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /examples/5a7db6c74d55bc51bdf39793
router.delete('/campaigns/:id/comments/:commentId', requireToken, (req, res, next) => {
	Campaign.findById(req.params.id)
		.then(handle404)
		.then((foundCampaign) => {
			// throw an error if current user doesn't own `example`
			foundCampaign.comment.pull(req.params.commentId)
			foundCampaign.save()
			// delete the example ONLY IF the above didn't throw
			Comment.findById(req.params.commentId)
			.then(handle404)
			.then((comments) => {
				comments.deleteOne()
			})
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router


