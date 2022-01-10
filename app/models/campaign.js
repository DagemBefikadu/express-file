const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        cause: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        item: {
            type: String, 
            required: true,
        },
        image: {
            type: String,
        },
        category: {
            type: String,
        }, 
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }],
        contact: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact'
        }]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Campaign', campaignSchema)