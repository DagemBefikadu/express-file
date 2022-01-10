const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
	{
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		commented: {
			type: String,
			required: true,
		},
		campaignId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Campaign',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Comment', commentSchema)
