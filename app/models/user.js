const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			// required: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		favoriteCampaign: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Campaign'
		}],
		createdCampaign: [{
			type: mongoose.Schema.Types.ObjectId,
			ref:'Campaign'
		}],
		hashedPassword: {
			type: String,
			required: true,
		},
		token: String,
	},
	{
		timestamps: true,
		toObject: {
			// remove `hashedPassword` field when we call `.toObject`
			transform: (_doc, user) => {
				delete user.hashedPassword
				return user
			},
		},
	}
)

module.exports = mongoose.model('User', userSchema)
